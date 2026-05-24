import Dexie from 'dexie'

export const journalDb = new Dexie('DMJournal')

journalDb.version(1).stores({
  sessions: '++id, title, date, createdAt',
})

export const EMPTY_SESSION = {
  title:   '',
  date:    new Date().toISOString().slice(0, 10),
  content: '',
}
