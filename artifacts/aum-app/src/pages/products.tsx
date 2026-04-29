import { useGetProductSummary, useListProducts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Activity, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Products() {
  const { data: summary, isLoading: sumLoading } = useGetProductSummary();
  const { data: products, isLoading: prodLoading } = useListProducts();
  const [search, setSearch] = useState("");

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
        <p className="text-sm text-gray-500">Catalog and volume summary</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Top Products by Volume
          </h2>
          {sumLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>)}
            </div>
          ) : (
            <div className="space-y-3">
              {summary?.map((item, i) => (
                <div key={item.productId} className="bg-white border rounded-xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    #{i+1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.productName}</h3>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">{item.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{item.totalQuantity.toLocaleString()} pcs</div>
                    <div className="text-xs text-gray-500">{item.orderCount} orders</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Catalog
            </h2>
          </div>
          
          <Card className="border-border shadow-sm flex flex-col max-h-[600px]">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search catalog..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="overflow-y-auto p-4 space-y-3 flex-1">
              {prodLoading ? (
                <div className="text-center py-4 text-gray-500">Loading catalog...</div>
              ) : filteredProducts?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No products found</div>
              ) : (
                filteredProducts?.map(product => (
                  <div key={product.id} className="border rounded-lg p-3 hover:border-primary transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{product.category}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      {product.neckType && <div>Neck: <span className="font-medium text-gray-900">{product.neckType}</span></div>}
                      {product.gramWeight && <div>Weight: <span className="font-medium text-gray-900">{product.gramWeight}g</span></div>}
                    </div>
                    {product.description && <div className="mt-2 text-xs text-gray-500">{product.description}</div>}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
