import { supabase } from './supabase'

export async function loadMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select('id, name')
    .order('name')
  if (error) throw error
  return data || []
}

export async function loadWorkTypes() {
  const { data, error } = await supabase
    .from('work_types')
    .select('id, name')
    .order('name')
  if (error) throw error
  return data || []
}

export async function loadToothGroups() {
  const { data, error } = await supabase
    .from('tooth_groups')
    .select('id, name')
    .order('name')
  if (error) throw error
  return data || []
}

export async function loadTeeth() {
  const { data, error } = await supabase
    .from('teeth')
    .select('id, fdi_code, tooth_group_id')
    .order('fdi_code')
  if (error) throw error
  return data || []
}

export async function loadValidWorkGroupCombinations() {
  const { data, error } = await supabase
    .from('work_type_tooth_group_combinations')
    .select('work_type_id, tooth_group_id')
  if (error) throw error
  return data || []
}

export async function priceRowsFromMatrix(productId, pricingMatrix) {
  const workTypes = await loadWorkTypes()
  const toothGroups = await loadToothGroups()

  const workTypeMap = {
    'corona_total': workTypes.find(wt => wt.name.toLowerCase().includes('corona'))?.id,
    'carilla': workTypes.find(wt => wt.name.toLowerCase().includes('carilla'))?.id,
    'incrustacion': workTypes.find(wt => wt.name.toLowerCase().includes('incrusta'))?.id,
    'puente': workTypes.find(wt => wt.name.toLowerCase().includes('puente'))?.id,
  }

  const groupMap = {
    'anterior': toothGroups.find(tg => tg.name.toLowerCase().includes('anterior'))?.id,
    'premolar': toothGroups.find(tg => tg.name.toLowerCase().includes('premolar'))?.id,
    'molar': toothGroups.find(tg => tg.name.toLowerCase().includes('molar'))?.id,
  }

  const priceRows = []
  for (const [workTypeName, groups] of Object.entries(pricingMatrix)) {
    const workTypeId = workTypeMap[workTypeName]
    if (!workTypeId) continue

    for (const [groupName, price] of Object.entries(groups)) {
      const groupId = groupMap[groupName]
      const numPrice = parseFloat(price)
      if (groupId && numPrice > 0) {
        priceRows.push({
          product_id: productId,
          work_type_id: workTypeId,
          tooth_group_id: groupId,
          unit_price: numPrice
        })
      }
    }
  }
  return priceRows
}

export async function pricingMatrixFromRows(rows = []) {
  const matrix = {
    corona_total: { anterior: '', premolar: '', molar: '' },
    carilla: { anterior: '', premolar: '', molar: '' },
    incrustacion: { anterior: '', premolar: '', molar: '' },
    puente: { anterior: '', premolar: '', molar: '' },
  }
  if (rows.length === 0) return matrix

  const [workTypes, toothGroups] = await Promise.all([loadWorkTypes(), loadToothGroups()])
  const workKey = (name) => {
    const n = name.toLowerCase()
    if (n.includes('corona')) return 'corona_total'
    if (n.includes('carilla')) return 'carilla'
    if (n.includes('incrusta')) return 'incrustacion'
    if (n.includes('puente')) return 'puente'
  }
  const groupKey = (name) => {
    const n = name.toLowerCase()
    if (n.includes('anterior')) return 'anterior'
    if (n.includes('premolar')) return 'premolar'
    if (n.includes('molar')) return 'molar'
  }
  const workById = Object.fromEntries(workTypes.map(wt => [wt.id, workKey(wt.name)]))
  const groupById = Object.fromEntries(toothGroups.map(tg => [tg.id, groupKey(tg.name)]))

  rows.forEach(row => {
    const w = workById[row.work_type_id]
    const g = groupById[row.tooth_group_id]
    if (w && g) matrix[w][g] = row.unit_price
  })
  return matrix
}
