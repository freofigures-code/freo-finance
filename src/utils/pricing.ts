// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type PrintType = 'filamento' | 'resina';
export type PaintType = 'none' | 'simples' | 'media' | 'complexa';

export interface MarketplaceFee {
  percentual: number;   // ex: 0.20
  fixo: number;         // ex: 5 (R$)
}

export interface PaintConfig {
  tintaSimples: number;
  tintaMedia: number;
  tintaComplexa: number;
  primer: number;          // filamento: 0 | resina: spray_price / qtd_pecas
  verniz: number;          // filamento: 0 | resina: spray_price / qtd_pecas
  custoHora: number;
  hrsSimples: number;
  hrsMedia: number;
  hrsComplexa: number;
}

export interface FilamentoCustos {
  // Custo fixo
  aluguel: number;
  assinaturas: number;
  plataformas: number;
  taxaMei: number;
  publicidade: number;
  condominio: number;
  outrosCustoFixo: number;
  faturamentoPrevisto: number;   // ex: 2200

  // Custo variável
  custoKgFilamento: number;      // ex: 60
  potenciaImpressora: number;    // watts, ex: 350
  custoKwh: number;              // ex: 1.14
  embalagem: number;             // ex: 2
  frete: number;

  // Amortização impressoras
  impressoras: { nome: string; custo: number }[];
  vidaUtilMeses: number;         // ex: 24

  // Pintura
  pintura: PaintConfig;

  // Taxa de falha
  taxaFalha: number;             // ex: 0.10

  // Marketplaces
  shopee: MarketplaceFee;
  ml: MarketplaceFee;
  markup: number;                // ex: 2.5
}

export interface ResinaCustos {
  // Custo fixo
  aluguel: number;
  assinaturas: number;
  plataformas: number;
  taxaMei: number;
  publicidade: number;
  outrosCustoFixo: number;
  faturamentoPrevisto: number;   // ex: 5000

  // Custo variável
  custoKgResina: number;         // ex: 130
  potenciaImpressora: number;    // watts, ex: 96
  custoKwh: number;              // ex: 1.14
  embalagem: number;             // ex: 3
  frete: number;
  alcoolLimpeza: number;         // automático: (spray_price / qtd_pecas_por_frasco)

  // Amortização impressoras
  impressoras: { nome: string; custo: number }[];
  vidaUtilMeses: number;         // ex: 24

  // Pintura
  pintura: PaintConfig;

  // Taxa de falha
  taxaFalha: number;             // ex: 0.05

  // Marketplaces
  shopee: MarketplaceFee;
  ml: MarketplaceFee;
  markup: number;
}

export interface PrecoProduto {
  // Detalhamento de custo
  custoMaterial: number;
  custoEnergia: number;
  custoDireto: number;
  custoIndireto: number;
  percentualFalhas: number;
  custoTotal: number;

  // Sem pintura
  semPintura: {
    valorCliente: number;
    valorShopee: number;
    valorML: number;
    lucro: number;
  };

  // Com pintura (por tipo)
  custoPinturaSimples: number;
  custoPinturaMedia: number;
  custoPinturaComplexa: number;

  comPintura: {
    simples: { valorCliente: number; valorShopee: number; valorML: number; lucro: number };
    media:   { valorCliente: number; valorShopee: number; valorML: number; lucro: number };
    complexa:{ valorCliente: number; valorShopee: number; valorML: number; lucro: number };
  };
}

// ─── FUNÇÕES AUXILIARES ───────────────────────────────────────────────────────

function custoPintura(
  tinta: number,
  primer: number,
  verniz: number,
  hrs: number,
  custoHora: number
): number {
  // J30 = C26 + C29 + C30 + (C35 * C32)  ← filamento
  // J28 = C24 + C27 + C28 + (C33 * C30)  ← resina
  return tinta + primer + verniz + custoHora * hrs;
}

function valorMarketplace(valorCliente: number, fee: MarketplaceFee): number {
  // I9 = ROUNDUP(((I8*J9)+I8)+K9, 0)
  // = ROUNDUP(valorCliente * (1 + percentual) + fixo, 0)
  return Math.ceil(valorCliente * (1 + fee.percentual) + fee.fixo);
}

function calcPrecos(
  custoTotal: number,
  markup: number,
  shopee: MarketplaceFee,
  ml: MarketplaceFee,
  custoPint: number
) {
  // I8 = ROUNDUP(I27 * I5, 0)
  const valorCliente = Math.ceil(custoTotal * markup);
  const lucro = valorCliente - custoTotal;
  return {
    valorCliente,
    valorShopee: valorMarketplace(valorCliente, shopee),
    valorML: valorMarketplace(valorCliente, ml),
    lucro,
    custoPintura: custoPint,
  };
}

// ─── CALCULADORA FILAMENTO ────────────────────────────────────────────────────

export function calcularPrecoFilamento(
  tempoHoras: number,
  pesoGramas: number,
  cfg: FilamentoCustos
): PrecoProduto {
  const p = cfg.pintura;

  // --- Amortização (F23 = soma(impressoras) / vidaUtil)
  const totalAmortizacao =
    cfg.impressoras.reduce((s, i) => s + i.custo, 0) / cfg.vidaUtilMeses;

  // --- Total custo fixo (C20 = SUM(C9:C19))
  // A amortização fica na linha "Amortização" do custo fixo — user pode incluir ou não
  const totalCustoFixo =
    cfg.aluguel +
    cfg.assinaturas +
    cfg.plataformas +
    cfg.taxaMei +
    cfg.publicidade +
    cfg.condominio +
    cfg.outrosCustoFixo;
  // Nota: na planilha de filamento o usuário deixou amortização no custo fixo em branco (0),
  // mas na de resina incluiu. Se quiser incluir, some totalAmortizacao aqui.

  // --- Custo fixo dissolvido (C23 = C20 / C22)
  const custoFixoDissolvido =
    cfg.faturamentoPrevisto > 0 ? totalCustoFixo / cfg.faturamentoPrevisto : 0;

  // --- Custo material (filamento): (F9/1000) * E6
  const custoMaterial = (cfg.custoKgFilamento / 1000) * pesoGramas;

  // --- Custo energia: ((F11 * F10) / 1000) * C6
  const custoEnergia = ((cfg.potenciaImpressora * cfg.custoKwh) / 1000) * tempoHoras;

  // --- Custos diretos: I23 = custoMaterial + custoEnergia + embalagem + frete
  const custoDireto = custoMaterial + custoEnergia + cfg.embalagem + cfg.frete;

  // --- Custos indiretos: I24 = I23 * C23
  const custoIndireto = custoDireto * custoFixoDissolvido;

  // --- Percentual de falhas: I25 = (I23 + I24) * J25
  const percentualFalhas = (custoDireto + custoIndireto) * cfg.taxaFalha;

  // --- Custo total: I27 = SUM(I23:I25)
  const custoTotal = custoDireto + custoIndireto + percentualFalhas;

  // --- Tabela de pintura (sem primer/verniz no filamento)
  const custoPintSimples  = custoPintura(p.tintaSimples,  p.primer, p.verniz, p.hrsSimples,  p.custoHora);
  const custoPintMedia    = custoPintura(p.tintaMedia,    p.primer, p.verniz, p.hrsMedia,    p.custoHora);
  const custoPintComplexa = custoPintura(p.tintaComplexa, p.primer, p.verniz, p.hrsComplexa, p.custoHora);

  // --- Preços sem pintura
  const semPintura = calcPrecos(custoTotal, cfg.markup, cfg.shopee, cfg.ml, 0);

  // --- Preços com pintura (I18 = ROUNDUP((I27 + custoPintura) * I15, 0))
  const calcComPint = (custoPint: number) => {
    const base = custoTotal + custoPint;
    const valorCliente = Math.ceil(base * cfg.markup);
    return {
      valorCliente,
      valorShopee: valorMarketplace(valorCliente, cfg.shopee),
      valorML: valorMarketplace(valorCliente, cfg.ml),
      lucro: valorCliente - custoPint - custoTotal,
    };
  };

  return {
    custoMaterial,
    custoEnergia,
    custoDireto,
    custoIndireto,
    percentualFalhas,
    custoTotal,
    semPintura: {
      valorCliente: semPintura.valorCliente,
      valorShopee:  semPintura.valorShopee,
      valorML:      semPintura.valorML,
      lucro:        semPintura.lucro,
    },
    custoPinturaSimples:  custoPintSimples,
    custoPinturaMedia:    custoPintMedia,
    custoPinturaComplexa: custoPintComplexa,
    comPintura: {
      simples:  calcComPint(custoPintSimples),
      media:    calcComPint(custoPintMedia),
      complexa: calcComPint(custoPintComplexa),
    },
  };
}

// ─── CALCULADORA RESINA ───────────────────────────────────────────────────────

export function calcularPrecoResina(
  tempoHoras: number,
  pesoGramas: number,
  cfg: ResinaCustos
): PrecoProduto {
  const p = cfg.pintura;

  // --- Amortização (F21 = soma(impressoras) / vidaUtil)
  const totalAmortizacao =
    cfg.impressoras.reduce((s, i) => s + i.custo, 0) / cfg.vidaUtilMeses;

  // --- Total custo fixo INCLUI amortização (na resina, C12 = F21)
  const totalCustoFixo =
    cfg.aluguel +
    cfg.assinaturas +
    cfg.plataformas +
    cfg.taxaMei +
    cfg.publicidade +
    cfg.outrosCustoFixo +
    totalAmortizacao;  // ← diferença chave vs filamento

  // --- Custo fixo dissolvido (C21 = C18 / C20)
  const custoFixoDissolvido =
    cfg.faturamentoPrevisto > 0 ? totalCustoFixo / cfg.faturamentoPrevisto : 0;

  // --- Custo material (resina): (F7/1000) * E4
  const custoMaterial = (cfg.custoKgResina / 1000) * pesoGramas;

  // --- Custo energia: ((F9 * F8) / 1000) * C4
  const custoEnergia = ((cfg.potenciaImpressora * cfg.custoKwh) / 1000) * tempoHoras;

  // --- Custos diretos: I21 = custoMaterial + custoEnergia + embalagem + frete + alcool
  const custoDireto =
    custoMaterial + custoEnergia + cfg.embalagem + cfg.frete + cfg.alcoolLimpeza;

  // --- Custos indiretos: I22 = I21 * C21
  const custoIndireto = custoDireto * custoFixoDissolvido;

  // --- Percentual de falhas: I23 = (I21 + I22) * J23
  const percentualFalhas = (custoDireto + custoIndireto) * cfg.taxaFalha;

  // --- Custo total: I25 = SUM(I21:I23)
  const custoTotal = custoDireto + custoIndireto + percentualFalhas;

  // --- Tabela de pintura (resina TEM primer e verniz)
  const custoPintSimples  = custoPintura(p.tintaSimples,  p.primer, p.verniz, p.hrsSimples,  p.custoHora);
  const custoPintMedia    = custoPintura(p.tintaMedia,    p.primer, p.verniz, p.hrsMedia,    p.custoHora);
  const custoPintComplexa = custoPintura(p.tintaComplexa, p.primer, p.verniz, p.hrsComplexa, p.custoHora);

  // --- Preços sem pintura
  const semPintura = calcPrecos(custoTotal, cfg.markup, cfg.shopee, cfg.ml, 0);

  // --- Preços com pintura
  const calcComPint = (custoPint: number) => {
    const base = custoTotal + custoPint;
    const valorCliente = Math.ceil(base * cfg.markup);
    return {
      valorCliente,
      valorShopee: valorMarketplace(valorCliente, cfg.shopee),
      valorML: valorMarketplace(valorCliente, cfg.ml),
      lucro: valorCliente - custoPint - custoTotal,
    };
  };

  return {
    custoMaterial,
    custoEnergia,
    custoDireto,
    custoIndireto,
    percentualFalhas,
    custoTotal,
    semPintura: {
      valorCliente: semPintura.valorCliente,
      valorShopee:  semPintura.valorShopee,
      valorML:      semPintura.valorML,
      lucro:        semPintura.lucro,
    },
    custoPinturaSimples:  custoPintSimples,
    custoPinturaMedia:    custoPintMedia,
    custoPinturaComplexa: custoPintComplexa,
    comPintura: {
      simples:  calcComPint(custoPintSimples),
      media:    calcComPint(custoPintMedia),
      complexa: calcComPint(custoPintComplexa),
    },
  };
}

// ─── ENTRY POINT UNIFICADO ────────────────────────────────────────────────────

export function calcularPrecoProduto(
  tipo: PrintType,
  tempoHoras: number,
  pesoGramas: number,
  cfg: FilamentoCustos | ResinaCustos
): PrecoProduto {
  if (tipo === 'filamento') {
    return calcularPrecoFilamento(tempoHoras, pesoGramas, cfg as FilamentoCustos);
  }
  return calcularPrecoResina(tempoHoras, pesoGramas, cfg as ResinaCustos);
}
