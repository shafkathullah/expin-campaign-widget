import { faker } from '@faker-js/faker';

// Seed for reproducibility across runs — same starting state for every candidate
faker.seed(42);

const STATUSES = ['pending', 'live', 'completed'];

function pickStatus() {
  // Weighted: 20% pending, 55% live, 25% completed
  const r = faker.number.float({ min: 0, max: 1 });
  if (r < 0.2) return 'pending';
  if (r < 0.75) return 'live';
  return 'completed';
}

function generateCreator(i) {
  const status = pickStatus();
  // Pending creators have zero metrics; live and completed have varied numbers
  const views = status === 'pending' ? 0 : faker.number.int({ min: 200, max: 80000 });
  const conversionRate = status === 'pending'
    ? 0
    : faker.number.float({ min: 0.005, max: 0.18, fractionDigits: 4 });
  const conversions = Math.round(views * conversionRate);

  return {
    id: `creator_${i.toString().padStart(3, '0')}`,
    name: faker.person.fullName(),
    handle: '@' + faker.internet.userName().toLowerCase(),
    postStatus: status,
    views,
    conversions,
    conversionRate,
    boosted: false,
  };
}

export function generateCreators(count = 50) {
  return Array.from({ length: count }, (_, i) => generateCreator(i));
}
