from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).with_name("omniinvest-estres-mercado-ficticio.png")

labels = ["Renta variable\nficticia", "Renta fija\nficticia", "Efectivo\nficticio"]
baseline = np.array([50_000, 25_000, 15_000], dtype=float)
stressed = np.array([40_000, 20_000, 15_000], dtype=float)
weights_base = baseline / baseline.sum() * 100
weights_stressed = stressed / stressed.sum() * 100

plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10})
fig, axes = plt.subplots(1, 2, figsize=(12.5, 5.35))
fig.patch.set_facecolor("#F7F8FC")
fig.subplots_adjust(left=0.07, right=0.985, top=0.82, bottom=0.20, wspace=0.10)

x = np.arange(len(labels))
width = 0.34
axes[0].set_facecolor("#FFFFFF")
axes[0].bar(x - width / 2, baseline / 1000, width, label="Base", color="#2F5D8A")
axes[0].bar(x + width / 2, stressed / 1000, width, label="Estrés −20 %", color="#B54C4C")
axes[0].set_title("Valor por bucket — datos ficticios", loc="left", weight="bold")
axes[0].set_ylabel("Miles de EUR")
axes[0].set_xticks(x, labels)
axes[0].set_ylim(0, 60)
axes[0].grid(axis="y", alpha=0.2)
axes[0].legend(frameon=False, loc="upper right")
for spine in axes[0].spines.values():
    spine.set_visible(False)
for series, shift in ((baseline, -width / 2), (stressed, width / 2)):
    for idx, value in enumerate(series):
        axes[0].text(idx + shift, value / 1000 + 1.1, f"{value / 1000:.0f}", ha="center", color="#273142", weight="bold")

axes[1].set_facecolor("#FFFFFF")
axes[1].bar(x - width / 2, weights_base, width, label="Base", color="#2F5D8A")
axes[1].bar(x + width / 2, weights_stressed, width, label="Estrés −20 %", color="#B54C4C")
axes[1].set_title("Composición sobre total de cartera", loc="left", weight="bold")
axes[1].set_ylabel("Peso (%)")
axes[1].set_xticks(x, labels)
axes[1].set_ylim(0, 65)
axes[1].grid(axis="y", alpha=0.2)
for spine in axes[1].spines.values():
    spine.set_visible(False)
for series, shift in ((weights_base, -width / 2), (weights_stressed, width / 2)):
    for idx, value in enumerate(series):
        axes[1].text(idx + shift, value + 1.3, f"{value:.1f}", ha="center", color="#273142", weight="bold")

fig.suptitle("OmniInvest — sensibilidad uniforme y cambio de pesos", x=0.06, y=0.965, ha="left", fontsize=15, fontweight="bold", color="#172033")
fig.text(0.06, 0.055, "Hipótesis didáctica: −20 % solo sobre exposición valorada a mercado; sin FX, costes, impuestos, correlaciones ni liquidez.", color="#536174")
fig.savefig(OUT, dpi=180, bbox_inches="tight", facecolor=fig.get_facecolor())
print(OUT)
