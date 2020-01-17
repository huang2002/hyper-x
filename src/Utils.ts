import { ReactiveValue } from "./ReactiveValue";
import { ReactiveList } from "./ReactiveList";

export type ReactiveObject<T extends object> = {
    [K in keyof T]: T[K] | ReactiveValue<T[K]>;
};

export const Utils = {

    removeIndex(array: any[], index: number) {
        for (let i = index; i < array.length - 1; i++) {
            array[i] = array[i + 1];
        }
        array.length--;
    },

    insertIndex<T>(array: T[], index: number, value: T) {
        for (let i = index; i < array.length - 1; i++) {
            array[i + 1] = array[i];
        }
        array[index] = value;
    },

    createFragment(nodes: unknown[]) {
        const fragment = document.createDocumentFragment();
        nodes.forEach(node => {
            fragment.appendChild(Utils.toNode(node));
        });
        return fragment;
    },

    toNode(value: unknown) {
        switch (typeof value) {
            case 'number':
            case 'bigint':
                return document.createTextNode('' + value);
            case 'string':
                return document.createTextNode(value as string);
            case 'object':
                if (!value) {
                    break;
                }
                if (value instanceof Node) {
                    return value;
                } else if (value instanceof ReactiveValue) {
                    return value.toNode();
                } else if (value instanceof ReactiveList) {
                    return value.toElement();
                }
        }
        return document.createTextNode('');
    },

    iterate<T>(object: { [key: string]: T; }, iterator: (key: string, value: T) => void) {
        Object.keys(object).forEach(key => {
            iterator(key, (object as any)[key]);
        });
    },

    setProperties<T extends object>(object: T, properties: Partial<ReactiveObject<T>>) {
        Utils.iterate(properties, (key, value) => {
            const originalValue = (object as any)[key],
                valueIsReactive = value instanceof ReactiveValue;
            if (originalValue instanceof ReactiveValue) {
                if (valueIsReactive) {
                    originalValue.linkOrigin(value as ReactiveValue<unknown>, newValue => {
                        originalValue.setSync(newValue);
                    });
                } else {
                    originalValue.setSync(value);
                }
            } else {
                if (valueIsReactive) {
                    (value as ReactiveValue<unknown>).link(object as Record<string, unknown>, key);
                } else {
                    (object as any)[key] = value;
                }
            }
        });
    },

    destroy(value: object) {
        if (value instanceof ReactiveValue) {
            value.unlinkOrigin();
        } else {
            Utils.iterate(value as any, (key, property) => {
                if (property && typeof property === 'object') {
                    if (property instanceof ReactiveValue) {
                        property.unlinkOrigin();
                    } else {
                        Utils.destroy(property!);
                    }
                }
            });
        }
    },

    isEqual(a: unknown, b: unknown) {
        if (Object.is(a, b)) {
            return true;
        } else if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
            return a.every((v, i) => Object.is(v, b[i]));
        } else if (typeof a === 'object' && typeof b === 'object' && a && b) {
            if (a instanceof Node) {
                if (b instanceof Node) {
                    return a.isEqualNode(b);
                } else {
                    return false;
                }
            } else if (b instanceof Node) {
                return false;
            }
            const keysA = Object.keys(a),
                keysB = Object.keys(b);
            if (keysA.length !== keysB.length) {
                return false;
            }
            return keysA.every(
                k => keysB.includes(k) && Object.is((a as any)[k], (b as any)[k])
            );
        }
    },

} as const;
