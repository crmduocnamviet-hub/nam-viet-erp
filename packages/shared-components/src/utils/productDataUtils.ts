/**
 * Utility functions for ProductForm data conversion and transformation
 */

// Type definitions for product data
export interface ProductFormData {
  name?: string;
  registrationNumber?: string;
  category?: string;
  packaging?: string;
  description?: string;
  route?: string;
  hdsd_0_2?: string;
  hdsd_2_6?: string;
  hdsd_6_18?: string;
  hdsd_over_18?: string;
  disease?: string;
  isChronic?: boolean;
  wholesaleUnit?: string;
  retailUnit?: string;
  conversionRate?: number;
  manufacturer?: string;
  distributor?: string;
  tags?: string[];
}

/**
 * Converts raw data to ProductFormData with type safety
 * @param data - Raw data from API or PDF extraction
 * @returns Safely converted ProductFormData
 */
export const convertToProductFormData = (data: any): ProductFormData => {
  if (!data || typeof data !== "object") {
    return {};
  }

  return {
    name: data.name,
    registrationNumber: data.registrationNumber,
    category: data.category,
    packaging: data.packaging,
    description: data.description,
    route: data.route,
    hdsd_0_2: data.hdsd_0_2,
    hdsd_2_6: data.hdsd_2_6,
    hdsd_6_18: data.hdsd_6_18,
    hdsd_over_18: data.hdsd_over_18,
    disease: data.disease,
    isChronic: data.isChronic,
    wholesaleUnit: data.wholesaleUnit,
    retailUnit: data.retailUnit,
    conversionRate: data.conversionRate,
    manufacturer: data.manufacturer,
    distributor: data.distributor,
    tags: data.tags,
  };
};

/**
 * Filters out undefined values from form data
 * @param data - ProductFormData with potential undefined values
 * @returns Clean object without undefined values
 */
export const removeUndefinedValues = <T extends Record<string, any>>(
  data: T
): Partial<T> => {
  const cleanedData: Partial<T> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanedData[key as keyof T] = value;
    }
  });

  return cleanedData;
};

/**
 * Transforms PDF extraction data to form values
 * @param data - Raw PDF extraction data
 * @returns Cleaned form values ready for form.setFieldsValue()
 */
export const transformPdfDataToFormValues = (
  data: any
): Partial<ProductFormData> => {
  const convertedData = convertToProductFormData(data);
  return removeUndefinedValues(convertedData);
};
