export const FLEET_SERVICE = 'FLEET_SERVICE';

export const FLEET_QUEUE = 'fleet_events';

export const FLEET_DLX = 'fleet_events.dlx';
export const FLEET_DLQ = 'fleet_events.dlq';

export const EventPatterns = {
  VEHICLE_CREATED: 'vehicle.created',
  VEHICLE_UPDATED: 'vehicle.updated',
  VEHICLE_DELETED: 'vehicle.deleted',
} as const;
