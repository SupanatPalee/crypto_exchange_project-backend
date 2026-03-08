import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute, DisputeStatus } from '../../database/entities/dispute.entity.js';
import { Order, OrderStatus } from '../../database/entities/order.entity.js';
import { OrdersService } from '../orders/orders.service.js';
import { CreateDisputeDto } from './dto/create-dispute.dto.js';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto.js';

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(Dispute)
    private readonly disputeRepository: Repository<Dispute>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly ordersService: OrdersService,
  ) {}

  async findOne(id: string): Promise<Dispute | null> {
    return this.disputeRepository.findOne({
      where: { id },
      relations: ['order', 'raisedBy', 'resolvedBy'],
    });
  }

  async create(
    userId: string,
    dto: CreateDisputeDto,
  ): Promise<Dispute> {
    const order = await this.ordersService.findOne(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Only PAID orders can be disputed');
    }
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('Not your order');
    }
    const existing = await this.disputeRepository.findOne({
      where: { orderId: dto.orderId },
    });
    if (existing) throw new BadRequestException('Dispute already exists for this order');

    const dispute = this.disputeRepository.create({
      orderId: dto.orderId,
      raisedById: userId,
      reason: dto.reason,
      evidenceUrl: dto.evidenceUrl ?? null,
      status: DisputeStatus.OPEN,
    });
    const saved = await this.disputeRepository.save(dispute);
    order.status = OrderStatus.DISPUTED;
    await this.orderRepository.save(order);
    return saved;
  }

  async resolve(
    disputeId: string,
    resolvedById: string,
    dto: ResolveDisputeDto,
  ): Promise<Dispute> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ['order'],
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException('Dispute already resolved');
    }
    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolution = dto.resolution;
    dispute.resolvedById = resolvedById;
    dispute.resolvedAt = new Date();
    await this.disputeRepository.save(dispute);
    if (dto.winner === 'buyer') {
      await this.ordersService.forceReleaseOrder(dispute.orderId);
    }
    const updated = await this.findOne(disputeId);
    if (!updated) throw new NotFoundException('Dispute not found');
    return updated;
  }
}
