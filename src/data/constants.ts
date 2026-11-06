import type { ReportSummary } from '../types';

export const operationalAreas = [
  'Fotografia', 'Story', 'Projeção', 'Iluminação',
  'Transmissão', 'Sonorização', 'Redação',
]

export const transverseFunctions = ['Manager', 'Líder do Dia']
export const accessLevels = ['Liderança Geral', 'Líder de Área']

export const occurrenceCategories = [
  'Atrasos', 'Ausência', 'Falha no equipamento', 'Sugestão',
  'Elogio', 'Erro na operação', 'Falha de comunicação', 'Outros',
]

export const recentReports: ReportSummary[] = [
  { id: 1, title: 'Culto do Espírito', date: '05/11/2026', status: 'Rascunho' },
  { id: 2, title: 'Celebração', date: '01/11/2026', status: 'Enviado' },
]
