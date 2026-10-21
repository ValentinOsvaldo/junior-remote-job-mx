// Run: pnpm test  (node's built-in runner, no extra deps)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildIndex, parseQuery, searchJobs } from './search.ts'
import type { Job } from './types.ts'

const job = (over: Partial<Job>): Job => ({
  id: over.title!, company: 'Acme', level: 'junior', categories: ['frontend'], stack: [], modality: 'onsite',
  city: null, state: null, salaryMin: null, salaryMax: null, summary: '', source: 'indeed', url: '',
  postedAt: '2026-10-01', firstSeen: '', title: '', ...over,
})

const jobs = [
  job({ title: 'Desarrollador Frontend Jr', stack: ['React', 'TypeScript'], modality: 'remote', salaryMin: 15000, salaryMax: 18000 }),
  job({ title: 'Angular Developer Junior', stack: ['Angular'], city: 'Guadalajara', state: 'Jalisco' }),
  job({ title: 'Becario Backend', level: 'intern', stack: ['Python'], summary: 'Trabajo en home office', source: 'linkedin' }),
]
const run = (q: string) => searchJobs(jobs, buildIndex(jobs), q).map((r) => r.job.title)

test('parseQuery', () => {
  assert.deepEqual(parseQuery('react -angular "home office" stack:Node sueldo:>15k foo:bar'), [
    { neg: false, key: null, value: 'react', phrase: false },
    { neg: true, key: null, value: 'angular', phrase: false },
    { neg: false, key: null, value: 'home office', phrase: true },
    { neg: false, key: 'stack', value: 'node', phrase: false },
    { neg: false, key: 'salary', value: '>15k', phrase: false },
    { neg: false, key: null, value: 'foo:bar', phrase: false },
  ])
})

test('searchJobs', () => {
  assert.equal(run('').length, 3)
  assert.deepEqual(run('desarolador'), ['Desarrollador Frontend Jr']) // fuzzy
  assert.deepEqual(run('-angular -backend'), ['Desarrollador Frontend Jr'])
  assert.deepEqual(run('"home office"'), ['Becario Backend'])
  assert.deepEqual(run('ciudad:gdl'), ['Angular Developer Junior'])
  assert.deepEqual(run('nivel:becario'), ['Becario Backend'])
  assert.deepEqual(run('modo:remoto stack:type'), ['Desarrollador Frontend Jr'])
  assert.deepEqual(run('sueldo:>16k'), ['Desarrollador Frontend Jr'])
  assert.deepEqual(run('sueldo:10k-12k'), [])
  assert.deepEqual(run('-fuente:indeed'), ['Becario Backend'])
})
