// inventory-api/src/products.ts

export type Product = {
  id: string;
  name: string;
  stock: number;
  price: number;
};

// Initial seed data for the in-memory repository
export const initialProducts: Product[] = [
  {
    id: 'p1',
    name: 'Coffee Machine',
    stock: 3,
    price: 100,
  },
  {
    id: 'p2',
    name: 'Electric Kettle',
    stock: 0,
    price: 40,
  },
  {
    id: 'p3',
    name: 'Toaster',
    stock: 10,
    price: 35,
  },
  {
    id: 'p4',
    name: 'Espresso Grinder',
    stock: 5,
    price: 120,
  },
  {
    id: 'p5',
    name: 'Milk Frother',
    stock: 8,
    price: 25,
  },
];
