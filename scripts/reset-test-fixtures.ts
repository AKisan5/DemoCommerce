import { existingFixtureUsers, fixtureAdmin, writeBuyerFixtures } from './provision-test-users'
import { TEST_BUYERS } from '../src/shared/fixtures'

/** Reset only four known orders; never issue db reset --linked or delete users. */
async function resetTestFixtures(): Promise<void> {
  const admin = fixtureAdmin()
  const users = await existingFixtureUsers(admin)
  for (const buyer of TEST_BUYERS) {
    if (!users.has(buyer.email)) throw new Error('Provision both synthetic accounts with npm run fixtures:provision before resetting orders.')
  }
  for (const buyer of TEST_BUYERS) {
    await writeBuyerFixtures(admin, buyer.key, users.get(buyer.email)!.id, true)
  }
  console.info('Reset 4 known synthetic orders and their items. Other records and Auth users were preserved.')
}

resetTestFixtures().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Synthetic fixture reset failed.')
  process.exitCode = 1
})
