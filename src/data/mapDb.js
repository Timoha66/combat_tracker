import Dexie from 'dexie'

export const mapDb = new Dexie('DMMap')

mapDb.version(1).stores({
  pins:  '++id, type, locationId',
  token: 'id',
})

export const EMPTY_PIN = {
  type:       'unknown',
  label:      '',
  notes:      '',
  locationId: null,
  x:          0.5,
  y:          0.5,
}
