export type Product = {
  id: string;
  name: string;
  stock: number;
  price: number;
};

export const products: Product[] = [
  {
    id: "p1",
    name: "Coffee Machine",
    stock: 3,
    price: 100
  },
  {
    id: "p2",
    name: "Electric Kettle",
    stock: 0,
    price: 40
  },
  {
    id: "p3",
    name: "Toaster",
    stock: 10,
    price: 35
  }
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}