import { Route } from "@/types";

export interface RouteStorage {
  getRoutes(): Promise<Route[]>;
  getRoute(id: string): Promise<Route | null>;
  saveRoute(route: Route): Promise<void>;
  updateRouteName(id: string, name: string): Promise<void>;
  updateRouteColor(id: string, color: string): Promise<void>;
  deleteRoute(id: string): Promise<void>;
}

// 1. LocalStorage Implementation (Fallback)
export class LocalStorageRouteStorage implements RouteStorage {
  private key = "ploggo_routes";

  async getRoutes(): Promise<Route[]> {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(this.key);
    if (!data) return [];
    try {
      const parsed: Route[] = JSON.parse(data);
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

// 2. Hybrid Implementation (API routing to Server DB with Local fallback)
export class HybridRouteStorage implements RouteStorage {
  private local = new LocalStorageRouteStorage();
  private useServer: boolean | null = null;

  private async checkConnection(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (this.useServer !== null) return this.useServer;
    
    try {
      const res = await fetch("/api/routes", { method: "GET", cache: "no-store" });
      if (res.status === 200) {
        this.useServer = true;
        console.log("Ploggo storage: Server DB sync active.");
        return true;
      } else {
        this.useServer = false;
        console.log("Ploggo storage: Server DB missing, falling back to LocalStorage.");
        return false;
      }
    } catch {
      this.useServer = false;
      console.log("Ploggo storage: Server DB fetch failed, falling back to LocalStorage.");
      return false;
    }
  }

  async getRoutes(): Promise<Route[]> {
    const isServer = await this.checkConnection();
    if (isServer) {
      try {
        const res = await fetch("/api/routes", { cache: "no-store" });
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Failed to fetch routes from server DB, using local", err);
      }
    }
    return this.local.getRoutes();
  }

  async getRoute(id: string): Promise<Route | null> {
    const isServer = await this.checkConnection();
    if (isServer) {
      try {
        const routes = await this.getRoutes();
        return routes.find((r) => r.id === id) || null;
      } catch {}
    }
    return this.local.getRoute(id);
  }

  async saveRoute(route: Route): Promise<void> {
    const isServer = await this.checkConnection();
    if (isServer) {
      try {
        const res = await fetch("/api/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(route),
        });
        if (res.ok) return;
      } catch (err) {
        console.error("Failed to save route to server DB, using local", err);
      }
    }
    return this.local.saveRoute(route);
  }

  async updateRouteName(id: string, name: string): Promise<void> {
    const isServer = await this.checkConnection();
    if (isServer) {
      try {
        const res = await fetch(`/api/routes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (res.ok) return;
      } catch (err) {
        console.error("Failed to update route name on server", err);
      }
    }
    return this.local.updateRouteName(id, name);
  }

  async updateRouteColor(id: string, color: string): Promise<void> {
    const isServer = await this.checkConnection();
    if (isServer) {
      try {
        const res = await fetch(`/api/routes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ color }),
        });
        if (res.ok) return;
      } catch (err) {
        console.error("Failed to update route color on server", err);
      }
    }
    return this.local.updateRouteColor(id, color);
  }

  async deleteRoute(id: string): Promise<void> {
    const isServer = await this.checkConnection();
    if (isServer) {
      try {
        const res = await fetch(`/api/routes/${id}`, {
          method: "DELETE",
        });
        if (res.ok) return;
      } catch (err) {
        console.error("Failed to delete route on server", err);
      }
    }
    return this.local.deleteRoute(id);
  }
}

// Default export is the hybrid instance.
export const routeStorage: RouteStorage = new HybridRouteStorage();
