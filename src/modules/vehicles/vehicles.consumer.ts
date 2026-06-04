import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { Channel, Message } from 'amqplib';
import { EventPatterns } from '../../config/rabbitmq/rabbitmq.constants';

interface VehicleEvent {
  id: string;
  licensePlate?: string;
  createdBy?: string;
}

@Controller()
export class VehiclesConsumer {
  private readonly logger = new Logger(VehiclesConsumer.name);

  @EventPattern(EventPatterns.VEHICLE_CREATED)
  async handleVehicleCreated(
    @Payload() data: VehicleEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(context, () => {
      this.logger.log(`Veículo criado: ${data.licensePlate ?? data.id}`);
    });
  }

  @EventPattern(EventPatterns.VEHICLE_UPDATED)
  async handleVehicleUpdated(
    @Payload() data: VehicleEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(context, () => {
      this.logger.log(`Veículo atualizado: ${data.id}`);
    });
  }

  @EventPattern(EventPatterns.VEHICLE_DELETED)
  async handleVehicleDeleted(
    @Payload() data: VehicleEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(context, () => {
      this.logger.log(`Veículo removido: ${data.id}`);
    });
  }

  private async process(
    context: RmqContext,
    handler: () => void | Promise<void>,
  ): Promise<void> {
    const channel = context.getChannelRef() as Channel;
    const message = context.getMessage() as Message;

    try {
      await handler();
      channel.ack(message);
    } catch (error) {
      this.logger.error(
        `Falha ao processar evento: ${(error as Error).message}`,
        (error as Error).stack,
      );
      channel.nack(message, false, false);
    }
  }
}
