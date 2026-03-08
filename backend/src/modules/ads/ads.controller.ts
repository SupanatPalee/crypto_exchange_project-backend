import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdsService } from './ads.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../../database/entities/user.entity.js';
import { CreateAdDto } from './dto/create-ad.dto.js';
import { UpdateAdDto } from './dto/update-ad.dto.js';

@Controller('ads')
@ApiTags('Ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List ads (public)' })
  @ApiQuery({ name: 'type', required: false, example: 'SELL' })
  @ApiQuery({ name: 'crypto', required: false, example: 'BTC' })
  @ApiResponse({ status: 200, description: 'OK' })
  async list(
    @Query('type') type?: string,
    @Query('crypto') crypto?: string,
  ) {
    return this.adsService.findAll({ type, crypto });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an ad' })
  @ApiBody({ type: CreateAdDto })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Validation/business rule error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@CurrentUser() user: User, @Body() dto: CreateAdDto) {
    return this.adsService.create(user.id, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get ad by id (public)' })
  @ApiParam({ name: 'id', description: 'Ad id (UUID)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Ad not found' })
  async getOne(@Param('id') id: string) {
    const ad = await this.adsService.findOne(id);
    if (!ad) throw new NotFoundException('Ad not found');
    return ad;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update ad' })
  @ApiParam({ name: 'id', description: 'Ad id (UUID)' })
  @ApiBody({ type: UpdateAdDto })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Ad not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateAdDto,
  ) {
    return this.adsService.update(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel ad' })
  @ApiParam({ name: 'id', description: 'Ad id (UUID)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Ad not found' })
  async cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.adsService.cancel(id, user.id);
  }
}
