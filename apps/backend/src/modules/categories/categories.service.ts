import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CategoryOrmEntity } from '../../infrastructure/database/typeorm/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repo: Repository<CategoryOrmEntity>,
  ) {}

  /**
   * Devuelve categorías del sistema (isDefault) + personalizadas del usuario.
   */
  async findAll(userId: string) {
    return this.repo.find({
      where: [
        { isDefault: true, userId: IsNull() },
        { userId },
      ],
      order: { type: 'ASC', name: 'ASC' },
    });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const category = this.repo.create({ ...dto, userId, isDefault: false });
    return this.repo.save(category);
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.findOneOwned(userId, id);
    Object.assign(category, dto);
    return this.repo.save(category);
  }

  async remove(userId: string, id: string) {
    const category = await this.findOneOwned(userId, id);
    await this.repo.remove(category);
    return { message: 'Categoría eliminada' };
  }

  private async findOneOwned(userId: string, id: string) {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    if (category.isDefault) throw new ForbiddenException('No puedes modificar categorías del sistema');
    if (category.userId !== userId) throw new ForbiddenException('No tienes permiso sobre esta categoría');
    return category;
  }
}
