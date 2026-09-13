import { DataSource, IsNull } from 'typeorm';
import { CategoryOrmEntity } from '../typeorm/entities/category.entity';

const DEFAULT_CATEGORIES = [
  // ── Gastos ─────────────────────────────────────────────
  { name: 'Alimentación',    icon: 'fast-food-outline',      color: '#F59E0B', type: 'expense' as const },
  { name: 'Transporte',      icon: 'car-outline',            color: '#3B82F6', type: 'expense' as const },
  { name: 'Vivienda',        icon: 'home-outline',           color: '#8B5CF6', type: 'expense' as const },
  { name: 'Salud',           icon: 'medical-outline',        color: '#EF4444', type: 'expense' as const },
  { name: 'Educación',       icon: 'school-outline',         color: '#06B6D4', type: 'expense' as const },
  { name: 'Entretenimiento', icon: 'game-controller-outline',color: '#EC4899', type: 'expense' as const },
  { name: 'Ropa',            icon: 'shirt-outline',          color: '#A78BFA', type: 'expense' as const },
  { name: 'Tecnología',      icon: 'laptop-outline',         color: '#64748B', type: 'expense' as const },
  { name: 'Servicios',       icon: 'flash-outline',          color: '#F97316', type: 'expense' as const },
  { name: 'Otros gastos',    icon: 'ellipsis-horizontal',    color: '#6B7280', type: 'expense' as const },
  // ── Ingresos ───────────────────────────────────────────
  { name: 'Salario',         icon: 'briefcase-outline',      color: '#10B981', type: 'income' as const },
  { name: 'Freelance',       icon: 'code-slash-outline',     color: '#10B981', type: 'income' as const },
  { name: 'Inversiones',     icon: 'trending-up-outline',    color: '#10B981', type: 'income' as const },
  { name: 'Otros ingresos',  icon: 'cash-outline',           color: '#10B981', type: 'income' as const },
];

export async function seedCategories(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(CategoryOrmEntity);

  for (const cat of DEFAULT_CATEGORIES) {
    const exists = await repo.findOne({
      where: { name: cat.name, isDefault: true, userId: IsNull() },
    });
    if (!exists) {
      const entity = repo.create({
        name:      cat.name,
        icon:      cat.icon,
        color:     cat.color,
        type:      cat.type,
        isDefault: true,
        // userId se deja undefined → NULL en DB
      });
      await repo.save(entity);
    }
  }
  console.log('✅ Categorías por defecto sembradas');
}
