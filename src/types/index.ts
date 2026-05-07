import { Database } from './database'

export type Board = Database['public']['Tables']['boards']['Row']
export type Column = Database['public']['Tables']['columns']['Row']
export type Card = Database['public']['Tables']['cards']['Row']
export type Label = Database['public']['Tables']['labels']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

export interface CardWithLabels extends Card {
  labels: Label[]
  assignee?: any
}

export interface ColumnWithCards extends Column {
  cards: CardWithLabels[]
}

export interface BoardData extends Board {
  columns: ColumnWithCards[]
}
