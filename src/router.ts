import { Value } from "./Value";
import { _toArray, _normalize } from "./utils";

export type RouteMap<T extends string = string> = Record<T, (router: Value<T>) => any>;

type RouteNames<T extends RouteMap> = T extends RouteMap<infer U> ? U : never;

export const createRouter = <T extends RouteMap = RouteMap>(
    defaultRoute: RouteNames<T> | Value<RouteNames<T>>, routeMap: T
) => {
    const routeCache = new Map<RouteNames<T>, any>(),
        router = ((defaultRoute as any)._isXV ?
            defaultRoute :
            Value.of(defaultRoute)
        ) as Value<RouteNames<T>>;
    return router.mapSync(routeName => {
        if (routeCache.has(routeName)) {
            return routeCache.get(routeName);
        } else {
            const route = _normalize(_toArray(routeMap[routeName](router as unknown as Value<string>)));
            routeCache.set(routeName, route);
            return route;
        }
    });
};
