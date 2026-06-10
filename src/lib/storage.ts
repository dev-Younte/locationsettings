import { Route } from "@/types";

export interface RouteStorage {
  getRoutes(): Promise<Route[]>;
  getRoute(id: string): Promise<Route | null>;
  saveRoute(route: Route): Promise<void>;
  updateRouteName(id: string, name: string): Promise<void>;
  updateRouteColor(id: string, color: string): Promise<void>;
  deleteRoute(id: string): Promise<void>;
}

export class LocalStorageRouteStorage implements RouteStorage {
  private key = "ploggo_routes";

  async getRoutes(): Promise<Route[]> {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(this.key);
    if (!data) return [];
    try {
      const parsed: Route[] = JSON.parse(data);
      // Fallback default color for old routes without color
      return parsed.map(r => ({
        ...r,
        color: r.color || "#3B82F6"
      }));
    } catch {
      return [];
    }
  }

  async getRoute(id: string): Promise<Route | null> {
    const routes = await this.getRoutes();
    return routes.find((r) => r.id === id) || null;
  }

  async saveRoute(route: Route): Promise<void> {
    const routes = await this.getRoutes();
    const cleanRoute = { ...route, color: route.color || "#3B82F6" };
    const index = routes.findIndex((r) => r.id === route.id);
    if (index > -1) {
      routes[index] = cleanRoute;
    } else {
      routes.push(cleanRoute);
    }
    localStorage.setItem(this.key, JSON.stringify(routes));
  }

  async updateRouteName(id: string, name: string): Promise<void> {
    const routes = await this.getRoutes();
    const index = routes.findIndex((r) => r.id === id);
    if (index > -1) {
      routes[index].name = name;
      localStorage.setItem(this.key, JSON.stringify(routes));
    }
  }

  async updateRouteColor(id: string, color: string): Promise<void> {
    const routes = await this.getRoutes();
    const index = routes.findIndex((r) => r.id === id);
    if (index > -1) {
      routes[index].color = color;
      localStorage.setItem(this.key, JSON.stringify(routes));
    }
  }


  async deleteRoute(id: string): Promise<void> {
    const routes = await this.getRoutes();
    const filtered = routes.filter((r) => r.id !== id);
    localStorage.setItem(this.key, JSON.stringify(filtered));
  }
}

// Default export is the localStorage instance.
// Easy to swap this instance with a Supabase or Vercel Postgres storage instance later.
export const routeStorage: RouteStorage = new LocalStorageRouteStorage();
