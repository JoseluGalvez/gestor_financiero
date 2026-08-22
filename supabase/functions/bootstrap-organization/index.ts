import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "http://localhost:3000",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Método no permitido." }), { status: 405, headers });

  const authorization = request.headers.get("Authorization");
  if (!authorization) return new Response(JSON.stringify({ error: "Sesión requerida." }), { status: 401, headers });

  const authClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authorization } } },
  );
  const { data: userData, error: userError } = await authClient.auth.getUser();
  const user = userData.user;
  if (userError || !user) return new Response(JSON.stringify({ error: "Sesión no válida." }), { status: 401, headers });

  let payload: { organizationName?: string; portfolioName?: string };
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "El cuerpo de la solicitud debe ser JSON." }), { status: 400, headers });
  }

  const organizationName = payload.organizationName?.trim();
  const portfolioName = payload.portfolioName?.trim() || "Cartera principal";
  if (!organizationName || organizationName.length < 2 || organizationName.length > 120 || portfolioName.length > 120) {
    return new Response(JSON.stringify({ error: "Indica un nombre de organización válido." }), { status: 400, headers });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: membership, error: membershipError } = await adminClient
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError) return new Response(JSON.stringify({ error: "No se pudo verificar la organización." }), { status: 500, headers });
  if (membership) return new Response(JSON.stringify({ error: "La cuenta ya tiene una organización activa." }), { status: 409, headers });

  const { error: profileError } = await adminClient.from("profiles").upsert({ id: user.id, display_name: user.email?.split("@")[0] ?? null });
  if (profileError) return new Response(JSON.stringify({ error: "No se pudo preparar el perfil." }), { status: 500, headers });

  const { data: organization, error: organizationError } = await adminClient
    .from("organizations")
    .insert({ name: organizationName, owner_id: user.id })
    .select("id, name")
    .single();
  if (organizationError || !organization) return new Response(JSON.stringify({ error: "No se pudo crear la organización." }), { status: 500, headers });

  const { error: memberCreateError } = await adminClient
    .from("organization_members")
    .insert({ organization_id: organization.id, user_id: user.id, role: "owner" });
  if (memberCreateError) {
    await adminClient.from("organizations").delete().eq("id", organization.id);
    return new Response(JSON.stringify({ error: "No se pudo asignar la organización a la cuenta." }), { status: 500, headers });
  }

  const { data: portfolio, error: portfolioError } = await adminClient
    .from("portfolios")
    .insert({ organization_id: organization.id, name: portfolioName, base_currency: "EUR" })
    .select("id, name, base_currency")
    .single();
  if (portfolioError || !portfolio) return new Response(JSON.stringify({ error: "Organización creada; falta configurar la cartera." }), { status: 500, headers });

  await adminClient.from("audit_events").insert({
    organization_id: organization.id,
    actor_id: user.id,
    action: "organization_bootstrapped",
    entity_type: "organization",
    entity_id: organization.id,
    metadata: { source: "bootstrap-organization" },
  });

  return new Response(JSON.stringify({ organization, portfolio }), { status: 201, headers });
});
