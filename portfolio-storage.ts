import type { PortfolioAggregation, PortfolioStorage, EncryptedPortfolioData } from "./portfolio-types";
import { encryptPortfolioData, decryptPortfolioData, isWebCryptoAvailable } from "./portfolio-crypto";

const STORAGE_KEY = "portafolio-intel-portfolio-v1";
const STORAGE_VERSION = 1;

export function isStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export async function savePortfolio(portfolio: any, password?: string): Promise<{ success: boolean; error?: string }> {
  if (!isStorageAvailable()) return { success: false, error: "LocalStorage no disponible" };

  try {
    const storage: any = {
      version: 1,
      encrypted: !!password,
      data: null,
      lastSync: Date.now(),
    };

    if (password) {
      if (!isWebCryptoAvailable()) {
        return { success: false, error: "Web Crypto API no disponible en este navegador" };
      }
      const encryptionResult = await encryptPortfolioData(portfolio, password);
      if (!encryptionResult.success || !encryptionResult.data) {
        return { success: false, error: encryptionResult.error ?? "Error al cifrar" };
      }
      storage.data = encryptionResult.data;
    } else {
      storage.data = portfolio;
    }
    localStorage.setItem("portafolio-intel-portfolio-v1", JSON.stringify(storage));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error al guardar" };
  }
}

export async function loadPortfolio(password?: string): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isStorageAvailable()) return { success: false, error: "LocalStorage no disponible" };

  try {
    const raw = localStorage.getItem("portafolio-intel-portfolio-v1");
    if (!raw) return { success: true, data: undefined };

    const storage = JSON.parse(raw);

    if (storage.encrypted) {
      if (!password) {
        return { success: false, error: "Se requiere contraseña para descifrar la cartera" };
      }
      if (!isWebCryptoAvailable()) {
        return { success: false, error: "Web Crypto API no disponible en este navegador" };
      }
      const encryptedData = storage.data;
      const result = await decryptPortfolioData(encryptedData, password);
      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "Error al descifrar" };
      }
      return { success: true, data: result.data };
    } else {
      return { success: true, data: storage.data };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error al cargar" };
  }
}

export function clearPortfolio(): { success: boolean; error?: string } {
  if (!isStorageAvailable()) return { success: false, error: "LocalStorage no disponible" };
  try {
    localStorage.removeItem("portafolio-intel-portfolio-v1");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error al borrar" };
  }
}

export function exportPortfolioData(portfolio: { totalValue: number; totalCostBasis: number }, password?: string): string {
  const storage = {
    version: 1,
    encrypted: !!password,
    data: null,
    lastSync: Date.now(),
  };
  if (password) {
    console.warn("Export with password not fully supported in sync mode");
  }
  return JSON.stringify({ ...storage, data: portfolio }, null, 2);
}

export function importPortfolioData(json: string, password?: string): { success: boolean; data?: { totalValue: number; totalCostBasis: number }; error?: string } {
  try {
    const storage = JSON.parse(json);
    if (storage.encrypted) {
      if (!password) {
        return { success: false, error: "Se requiere contraseña para importar cartera cifrada" };
      }
      return { success: false, error: "Importación cifrada requiere async" };
    } else {
      return { success: true, data: storage.data };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error al importar" };
  }
}

export function getStorageInfo(): { available: boolean; used: number } {
  if (!isStorageAvailable()) return { available: false, used: 0 };
  let used = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }
  return { available: true, used };
}