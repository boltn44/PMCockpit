import { v4 as uuidv4 } from 'uuid';
import { Resource, Project, Product } from '../types';

// Check if a string is a valid UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Migrate products to use UUIDs
export function migrateProductsData(products: Product[]): Product[] {
  try {
    return products.map(product => {
      if (!isValidUUID(product.id)) {
        return { ...product, id: uuidv4() };
      }
      return product;
    });
  } catch (error) {
    console.error('Error migrating products data:', error);
    return [];
  }
}

// Migrate resources to use UUIDs
export function migrateResourcesData(resources: Resource[]): Resource[] {
  try {
    return resources.map(resource => {
      if (!isValidUUID(resource.id)) {
        return { ...resource, id: uuidv4() };
      }
      return resource;
    });
  } catch (error) {
    console.error('Error migrating resources data:', error);
    return [];
  }
}

// Migrate projects to use UUIDs
export function migrateProjectsData(projects: Project[]): Project[] {
  try {
    return projects.map(project => {
      if (!isValidUUID(project.id)) {
        return { ...project, id: uuidv4() };
      }
      return project;
    });
  } catch (error) {
    console.error('Error migrating projects data:', error);
    return [];
  }
}

// Clear utilization data since it references old IDs
export function clearUtilizationData(): void {
  try {
    // Clear any existing utilization data from localStorage if it exists
    const utilizationKeys = Object.keys(localStorage).filter(key => 
      key.includes('utilization') || key.includes('date-range')
    );
    
    utilizationKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    if (utilizationKeys.length > 0) {
      console.log('Cleared utilization data due to ID migration');
    }
  } catch (error) {
    console.error('Error clearing utilization data:', error);
  }
}