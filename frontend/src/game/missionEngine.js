/**
 * Pure mission simulation rules for Junior Astronaut Mission Trainer.
 * Kept separate from React UI so gameplay can be tested and reused safely.
 */

export const RESOURCE_META = {
  power: { label: 'Power', unit: '%', criticalAt: 15 },
  water: { label: 'Water', unit: '%', criticalAt: 15 },
  food: { label: 'Food', unit: '%', criticalAt: 15 },
  lifeSupport: { label: 'Life Support', unit: '%', criticalAt: 20 },
  radiation: { label: 'Radiation Shielding', unit: '%', criticalAt: 20 },
};

export const INITIAL_RESOURCES = {
  power: 82,
  water: 76,
  food: 88,
  lifeSupport: 91,
  radiation: 84,
};

export const MISSION_EVENTS = [
  {
    id: 'solar-fluctuation',
    title: 'Solar Power Fluctuation',
    severity: 'warning',
    description: 'A dust front is reducing sunlight reaching the outpost solar array.',
    scienceNote: 'Dust and reduced solar illumination can lower power generation. Load shedding preserves energy for critical habitat systems.',
    choices: [
      {
        id: 'reduce-load',
        label: 'Reduce non-essential power',
        detail: 'Protect life support; pause lab equipment.',
        effects: { power: 9, lifeSupport: 2 },
        score: 12,
        feedback: 'Good systems thinking: non-essential loads are shed while critical habitat systems remain powered.',
      },
      {
        id: 'battery',
        label: 'Use emergency batteries',
        detail: 'Keep operations running, but drain reserves.',
        effects: { power: -8, lifeSupport: 5 },
        score: 7,
        feedback: 'The crew stays comfortable, but stored energy is a limited reserve. Plan to restore generation soon.',
      },
      {
        id: 'continue',
        label: 'Continue normal operations',
        detail: 'No immediate disruption; risk a deeper power deficit.',
        effects: { power: -14, lifeSupport: -5 },
        score: 2,
        feedback: 'Maintaining normal operations during a power shortfall increases risk to essential systems.',
      },
    ],
  },
  {
    id: 'water-leak',
    title: 'Habitat Water Leak',
    severity: 'critical',
    description: 'A leak is detected in a water recovery line. The source has not yet been isolated.',
    scienceNote: 'Closed-loop water recovery reduces resupply needs, but leaks and imperfect recovery require careful reserves management.',
    choices: [
      {
        id: 'isolate-leak',
        label: 'Isolate and repair the line',
        detail: 'Use crew time to stop the loss.',
        effects: { water: 8, power: -4, lifeSupport: 2 },
        score: 14,
        feedback: 'You contained the leak and protected the water reserve. Repair work used some power and crew time.',
      },
      {
        id: 'ration-water',
        label: 'Start water rationing',
        detail: 'Reduce consumption while diagnosing the leak.',
        effects: { water: 3, food: -1 },
        score: 8,
        feedback: 'Rationing buys time, though it does not fix the underlying equipment problem.',
      },
      {
        id: 'ignore-leak',
        label: 'Monitor without intervention',
        detail: 'Save time now; accept continued losses.',
        effects: { water: -15, lifeSupport: -4 },
        score: 0,
        feedback: 'The leak continued to consume a critical resource. Early intervention would have reduced the risk.',
      },
    ],
  },
  {
    id: 'filter-failure',
    title: 'Life-Support Filter Fault',
    severity: 'critical',
    description: 'A habitat sensor reports reduced efficiency in the air revitalization filter.',
    scienceNote: 'Crewed habitats rely on monitoring and maintaining life-support systems; faults should be treated before air quality degrades.',
    choices: [
      {
        id: 'replace-filter',
        label: 'Replace the filter',
        detail: 'Use a spare component and restore performance.',
        effects: { lifeSupport: 12, power: -3 },
        score: 14,
        feedback: 'You prioritized a crew-critical system and restored life-support performance.',
      },
      {
        id: 'backup-cycle',
        label: 'Switch to backup cycle',
        detail: 'Stabilize the habitat while using extra power.',
        effects: { lifeSupport: 6, power: -9 },
        score: 9,
        feedback: 'The backup cycle stabilized life support, but it increased power demand.',
      },
      {
        id: 'delay-repair',
        label: 'Delay until next shift',
        detail: 'Preserve time now, accept a growing system risk.',
        effects: { lifeSupport: -16, power: 1 },
        score: 0,
        feedback: 'Delaying a life-support repair allowed the fault to worsen. Crew safety systems should be prioritized.',
      },
    ],
  },
  {
    id: 'radiation-alert',
    title: 'Radiation Storm Alert',
    severity: 'critical',
    description: 'Forecast data indicates elevated solar particle activity. The crew must respond before exposure increases.',
    scienceNote: 'A storm shelter and shielding reduce exposure during solar particle events. Forecasts provide time to prepare, not a guarantee of exact conditions.',
    choices: [
      {
        id: 'shelter',
        label: 'Move crew to shielded shelter',
        detail: 'Pause outdoor work and secure the habitat.',
        effects: { radiation: 10, power: -3, food: -2 },
        score: 15,
        feedback: 'You reduced exposure risk by sheltering the crew and suspending non-essential activity.',
      },
      {
        id: 'shield-stores',
        label: 'Reinforce the safe area',
        detail: 'Use stored materials to improve shielding.',
        effects: { radiation: 7, water: -2, power: -2 },
        score: 11,
        feedback: 'Improving shielding helps, though the crew should still minimize exposure during the storm.',
      },
      {
        id: 'continue-outside',
        label: 'Continue outside operations',
        detail: 'Keep the schedule, with elevated exposure risk.',
        effects: { radiation: -18, lifeSupport: -3 },
        score: 0,
        feedback: 'Ignoring a radiation warning exposed the crew to avoidable risk. Safety forecasts should guide operations.',
      },
    ],
  },
];

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

function copyResources(resources) {
  return { ...resources };
}

export function createMissionState(environment = 'Moon') {
  return {
    environment,
    day: 1,
    score: 0,
    status: 'active',
    resources: copyResources(INITIAL_RESOURCES),
    currentEvent: MISSION_EVENTS[0],
    eventHistory: [],
    lastFeedback: null,
    alerts: [],
  };
}

function getOutcome(resources) {
  if (resources.lifeSupport <= 0 || resources.radiation <= 0) return 'failed';
  if (resources.water <= 0 || resources.food <= 0 || resources.power <= 0) return 'failed';
  if (Object.values(resources).some((value) => value <= 5)) return 'critical';
  return 'active';
}

function nextEvent(state) {
  const available = MISSION_EVENTS.filter((event) => event.id !== state.currentEvent?.id);
  return available[(state.day + state.eventHistory.length) % available.length] ?? MISSION_EVENTS[0];
}

/**
 * Apply one selected response and advance the simulation by one mission day.
 * Returns a new state object; the supplied state is never mutated.
 */
export function resolveDecision(state, choiceId) {
  if (!state || state.status !== 'active' || !state.currentEvent) return state;

  const choice = state.currentEvent.choices.find((item) => item.id === choiceId);
  if (!choice) return state;

  const resources = copyResources(state.resources);

  // Daily habitat use happens before event effects.
  resources.power = clamp(resources.power - 4);
  resources.water = clamp(resources.water - 3);
  resources.food = clamp(resources.food - 2);
  resources.lifeSupport = clamp(resources.lifeSupport - 1);
  resources.radiation = clamp(resources.radiation - (state.environment === 'Mars' ? 2 : 1));

  for (const [key, delta] of Object.entries(choice.effects)) {
    if (key in resources) resources[key] = clamp(resources[key] + delta);
  }

  const day = state.day + 1;
  const status = getOutcome(resources);
  const alerts = Object.entries(RESOURCE_META)
    .filter(([key, meta]) => resources[key] <= meta.criticalAt)
    .map(([key, meta]) => `${meta.label} is low (${resources[key]}${meta.unit}).`);

  const historyEntry = {
    day: state.day,
    eventId: state.currentEvent.id,
    eventTitle: state.currentEvent.title,
    choiceId: choice.id,
    choiceLabel: choice.label,
    effects: { ...choice.effects },
    scoreEarned: choice.score,
  };

  return {
    ...state,
    day,
    score: state.score + choice.score,
    resources,
    status,
    currentEvent: status === 'active' ? nextEvent({ ...state, day, eventHistory: [...state.eventHistory, historyEntry] }) : null,
    eventHistory: [...state.eventHistory, historyEntry],
    lastFeedback: {
      eventTitle: state.currentEvent.title,
      choiceLabel: choice.label,
      message: choice.feedback,
      scienceNote: state.currentEvent.scienceNote,
      effects: { ...choice.effects },
    },
    alerts,
  };
}

export function getResourceStatus(value, criticalAt = 20) {
  if (value <= criticalAt) return 'critical';
  if (value <= 40) return 'warning';
  return 'healthy';
}
