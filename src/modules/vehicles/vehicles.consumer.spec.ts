import { RmqContext } from '@nestjs/microservices';
import { VehiclesConsumer } from './vehicles.consumer';

describe('VehiclesConsumer', () => {
  let consumer: VehiclesConsumer;
  let channel: { ack: jest.Mock; nack: jest.Mock };
  const message = { content: Buffer.from('{}') };

  const buildContext = () =>
    ({
      getChannelRef: () => channel,
      getMessage: () => message,
    }) as unknown as RmqContext;

  beforeEach(() => {
    consumer = new VehiclesConsumer();
    channel = { ack: jest.fn(), nack: jest.fn() };
  });

  it('acks when vehicle.created is processed successfully', async () => {
    await consumer.handleVehicleCreated(
      { id: '1', licensePlate: 'ABC1D23' },
      buildContext(),
    );

    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('acks the update and delete events', async () => {
    await consumer.handleVehicleUpdated({ id: '1' }, buildContext());
    await consumer.handleVehicleDeleted({ id: '1' }, buildContext());

    expect(channel.ack).toHaveBeenCalledTimes(2);
  });

  it('nacks (without requeue) when the handler throws', async () => {
    const logger = consumer['logger'];
    jest.spyOn(logger, 'log').mockImplementation(() => {
      throw new Error('simulated failure');
    });

    await consumer.handleVehicleCreated({ id: '1' }, buildContext());

    expect(channel.nack).toHaveBeenCalledWith(message, false, false);
    expect(channel.ack).not.toHaveBeenCalled();
  });
});
