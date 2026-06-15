import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BillingInvoice,
  BillingInvoiceDocument,
} from './entities/billing-invoice.entity';

@Injectable()
export class BillingInvoiceRepositoryService {
  constructor(
    @InjectModel(BillingInvoice.name)
    private readonly model: Model<BillingInvoiceDocument>,
  ) {}

  create(data: Partial<BillingInvoice>): Promise<BillingInvoiceDocument> {
    return this.model.create(data);
  }

  findByIdentifier(
    identifier: string,
  ): Promise<BillingInvoiceDocument | null> {
    return this.model.findOne({ identifier }).exec();
  }

  findByGatewayInvoiceId(
    gatewayInvoiceId: string,
  ): Promise<BillingInvoiceDocument | null> {
    return this.model.findOne({ gatewayInvoiceId }).exec();
  }

  listByOrganization(
    organizationId: string,
  ): Promise<BillingInvoiceDocument[]> {
    return this.model.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  updateById(
    id: string,
    data: Partial<BillingInvoice>,
  ): Promise<BillingInvoiceDocument | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' })
      .exec();
  }

  deleteByOrganizationId(
    organizationId: string,
  ): Promise<{ deletedCount?: number }> {
    return this.model.deleteMany({ organizationId }).exec();
  }
}
