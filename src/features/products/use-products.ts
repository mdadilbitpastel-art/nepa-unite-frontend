"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { productService, type ProductSearchParams } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";
import type { Product } from "@/types";

export function useProducts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.products(params),
    queryFn: () => productService.list(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: qk.product(id),
    queryFn: () => productService.get(id),
    enabled: !!id,
  });
}

export function useProductSearch(params: ProductSearchParams) {
  return useQuery({
    queryKey: qk.productSearch(params),
    queryFn: () => productService.search(params),
    placeholderData: (prev) => prev,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: productService.categories,
    staleTime: 5 * 60_000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: qk.brands,
    queryFn: productService.brands,
    staleTime: 5 * 60_000,
  });
}

export function useProductsBySeller(sellerId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.productsBySeller(sellerId, params),
    queryFn: () => productService.bySeller(sellerId, params),
    enabled: !!sellerId,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Product>) => productService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Product> }) =>
      productService.update(id, body),
    onSuccess: (product) => {
      qc.setQueryData(qk.product(product.id), product);
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
