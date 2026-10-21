export const orderStatusStyles = {
  solicitado: 'bg-amber-100 text-amber-900 border border-amber-200',
  em_negociacao: 'bg-indigo-100 text-indigo-900 border border-indigo-200',
  confirmado: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
  concluido: 'bg-teal-100 text-teal-900 border border-teal-200',
  recusado: 'bg-rose-100 text-rose-900 border border-rose-200',
  cancelado: 'bg-slate-100 text-slate-700 border border-slate-200',
}

const orderStatusLabels = {
  customer: {
    solicitado: 'Aguardando fornecedor',
    em_negociacao: 'Em negociação',
    confirmado: 'Confirmado',
    recusado: 'Recusado',
    cancelado: 'Cancelado',
    concluido: 'Concluído',
  },
  supplier: {
    solicitado: 'Novo orçamento',
    em_negociacao: 'Em negociação',
    confirmado: 'Confirmado',
    recusado: 'Recusado',
    cancelado: 'Cancelado pelo cliente',
    concluido: 'Concluído',
  },
}

export function orderStatusLabel(status, perspective = 'customer') {
  const labels = orderStatusLabels[perspective] ?? orderStatusLabels.customer

  return labels[status] ?? status
}

export function orderStatusStyle(status) {
  return orderStatusStyles[status] ?? 'bg-slate-100 text-slate-700 border border-slate-200'
}
