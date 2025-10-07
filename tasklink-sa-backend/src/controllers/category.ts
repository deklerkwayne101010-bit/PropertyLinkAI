import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isWorker: boolean;
    isClient: boolean;
  };
}

const prisma = new PrismaClient();

// Predefined job categories for TaskLink SA
const DEFAULT_CATEGORIES = [
  {
    id: 'cleaning',
    name: 'Cleaning',
    description: 'House cleaning, office cleaning, deep cleaning',
    icon: '🧹',
    subcategories: ['House Cleaning', 'Office Cleaning', 'Deep Cleaning', 'Move-in/Move-out Cleaning']
  },
  {
    id: 'repairs',
    name: 'Repairs & Maintenance',
    description: 'Home repairs, appliance repair, electrical work',
    icon: '🔧',
    subcategories: ['Plumbing', 'Electrical', 'Appliance Repair', 'Carpentry', 'Painting']
  },
  {
    id: 'moving',
    name: 'Moving & Transport',
    description: 'Moving services, delivery, transportation',
    icon: '🚚',
    subcategories: ['House Moving', 'Office Moving', 'Furniture Delivery', 'Item Transport']
  },
  {
    id: 'delivery',
    name: 'Delivery & Errands',
    description: 'Package delivery, shopping, errands',
    icon: '📦',
    subcategories: ['Food Delivery', 'Package Delivery', 'Grocery Shopping', 'Personal Shopping']
  },
  {
    id: 'gardening',
    name: 'Gardening & Landscaping',
    description: 'Garden maintenance, landscaping, lawn care',
    icon: '🌱',
    subcategories: ['Lawn Mowing', 'Garden Maintenance', 'Landscaping', 'Tree Services']
  },
  {
    id: 'tutoring',
    name: 'Tutoring & Education',
    description: 'Academic tutoring, language lessons, skills training',
    icon: '📚',
    subcategories: ['Math Tutoring', 'Language Lessons', 'Music Lessons', 'Computer Skills']
  },
  {
    id: 'pet-care',
    name: 'Pet Care',
    description: 'Pet sitting, dog walking, pet grooming',
    icon: '🐕',
    subcategories: ['Dog Walking', 'Pet Sitting', 'Pet Grooming', 'Veterinary Transport']
  },
  {
    id: 'handyman',
    name: 'Handyman Services',
    description: 'General handyman work, installations, assemblies',
    icon: '👨‍🔧',
    subcategories: ['Furniture Assembly', 'TV Mounting', 'Shelf Installation', 'General Repairs']
  },
  {
    id: 'beauty',
    name: 'Beauty & Wellness',
    description: 'Hair styling, makeup, spa services',
    icon: '💄',
    subcategories: ['Hair Styling', 'Makeup Services', 'Nail Care', 'Massage Therapy']
  },
  {
    id: 'events',
    name: 'Event Services',
    description: 'Event planning, catering, photography',
    icon: '🎉',
    subcategories: ['Event Planning', 'Catering', 'Photography', 'DJ Services']
  }
];

// Types for request bodies
interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  subcategories?: string[];
}

// Category validation rules
export const createCategoryValidation = [
  body('name').isLength({ min: 2, max: 50 }).withMessage('Category name must be 2-50 characters'),
  body('description').optional().isLength({ min: 10, max: 200 }).withMessage('Description must be 10-200 characters'),
  body('icon').optional().isLength({ min: 1, max: 10 }).withMessage('Icon must be 1-10 characters'),
  body('subcategories').optional().isArray().withMessage('Subcategories must be an array'),
];

// Get all categories
export const getCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // For now, return predefined categories
    // In a real application, you might want to store these in the database
    const categories = DEFAULT_CATEGORIES.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      subcategories: category.subcategories,
      jobCount: 0 // This would be calculated from actual job data
    }));

    return res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    next(error);
  }
};

// Get category by ID
export const getCategoryById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
    }

    const category = DEFAULT_CATEGORIES.find(cat => cat.id === id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Get job count for this category (in a real app, this would be a database query)
    const jobCount = await prisma.job.count({
      where: { category: category.name }
    });

    return res.json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          subcategories: category.subcategories,
          jobCount
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Create new category (admin only)
export const createCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can create categories'
      });
    }

    const { name, description, icon, subcategories }: CreateCategoryRequest = req.body;

    // Check if category already exists
    const existingCategory = DEFAULT_CATEGORIES.find(cat =>
      cat.name.toLowerCase() === name.toLowerCase()
    );

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: 'Category already exists'
      });
    }

    // In a real application, you would save this to the database
    // For now, we'll just return success
    const newCategory = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description,
      icon: icon || '📋',
      subcategories: subcategories || [],
      jobCount: 0
    };

    return res.status(201).json({
      success: true,
      message: 'Category created successfully (Note: This is a demo implementation)',
      data: { category: newCategory }
    });

  } catch (error) {
    next(error);
  }
};

// Update category (admin only)
export const updateCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can update categories'
      });
    }

    const categoryIndex = DEFAULT_CATEGORIES.findIndex(cat => cat.id === id);

    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // In a real application, you would update this in the database
    // For now, we'll just return success
    const originalCategory = DEFAULT_CATEGORIES[categoryIndex];
    if (!originalCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const updatedCategory = {
      ...originalCategory,
      ...updateData,
      id: originalCategory.id // Keep original ID
    };

    return res.json({
      success: true,
      message: 'Category updated successfully (Note: This is a demo implementation)',
      data: { category: updatedCategory }
    });

  } catch (error) {
    next(error);
  }
};

// Delete category (admin only)
export const deleteCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can delete categories'
      });
    }

    const categoryIndex = DEFAULT_CATEGORIES.findIndex(cat => cat.id === id);

    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if category has active jobs
    const category = DEFAULT_CATEGORIES[categoryIndex];
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const jobCount = await prisma.job.count({
      where: { category: category.name }
    });

    if (jobCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category with ${jobCount} active jobs`
      });
    }

    // In a real application, you would delete this from the database
    // For now, we'll just return success
    const deletedCategory = DEFAULT_CATEGORIES[categoryIndex];

    return res.json({
      success: true,
      message: 'Category deleted successfully (Note: This is a demo implementation)',
      data: { category: deletedCategory }
    });

  } catch (error) {
    next(error);
  }
};

// Get popular categories (based on job count)
export const getPopularCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const categoriesWithCounts = await Promise.all(
      DEFAULT_CATEGORIES.map(async (category) => {
        const jobCount = await prisma.job.count({
          where: { category: category.name }
        });

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          jobCount
        };
      })
    );

    // Sort by job count (most popular first)
    const popularCategories = categoriesWithCounts
      .filter(cat => cat.jobCount > 0)
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 10); // Top 10

    return res.json({
      success: true,
      data: { categories: popularCategories }
    });

  } catch (error) {
    next(error);
  }
};