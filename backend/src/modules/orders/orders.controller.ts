import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../../database/entities/user.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PaidOrderDto } from './dto/paid-order.dto.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiTags('Orders')
@ApiBearerAuth('access-token')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from an ad' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Validation/business rule error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Ad not found' })
  async create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order with details' })
  @ApiParam({ name: 'id', description: 'Order id (UUID)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOne(@Param('id') id: string) {
    const order = await this.ordersService.findOrderWithDetails(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  @Patch(':id/paid')
  @ApiOperation({ summary: 'Mark order as paid (buyer)' })
  @ApiParam({ name: 'id', description: 'Order id (UUID)' })
  @ApiBody({ type: PaidOrderDto })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async markPaid(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: PaidOrderDto,
  ) {
    return this.ordersService.markPaid(id, user.id, dto.paymentProof);
  }

  @Patch(':id/release')
  @ApiOperation({ summary: 'Release crypto (seller)' })
  @ApiParam({ name: 'id', description: 'Order id (UUID)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async release(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ordersService.release(id, user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order id (UUID)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ordersService.cancel(id, user.id);
  }
}
