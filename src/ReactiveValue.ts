import { Reactive, ReactiveWatcher, ReactiveMapper } from "./Reactive";
import { Utils } from "./Utils";

export type ReactiveValueSetter<T> = (currentValue: T) => T;

export type Key = string | number | symbol;

export interface ReactiveLink<T, K extends Key, U> {
    target: Record<K, U>;
    key: K;
    watcher: ReactiveWatcher<T>;
}

export interface ReactiveValueBinding<T> {
    event: string;
    listener: (event: Event) => void;
    watcher: ReactiveWatcher<T>;
}

export class ReactiveValue<T> extends Reactive<T, T>{

    static getBindingEvent(element: HTMLElement) {
        return (element.tagName === 'INPUT' &&
            element.getAttribute('type') === 'range' ||
            element.tagName === 'SELECT') ?
            'change' : 'input';
    }

    private _setters = new Array<ReactiveValueSetter<T>>();
    private _origin: ReactiveValue<any> | null = null;
    private _originWatcher: ReactiveWatcher<any> | null = null;
    private _links = new Array<ReactiveLink<T, any, any>>();
    private _bindings = new Map<HTMLElement, ReactiveValueBinding<T>>();

    set(setter: ReactiveValueSetter<T>) {
        this._setters.push(setter);
        this._setSchedule();
        return this;
    }

    setSync(value: T) {
        this.current = value;
        this._setters.length = 0;
        this._setSchedule();
        return this;
    }

    update() {
        const value = this._setters.reduce((cur, setter) => setter(cur), this.current);
        this._setters.length = 0;
        this.current = value;
        this._getters.forEach(getter => {
            getter(value);
        });
        this._watchers.forEach(watcher => {
            watcher(value);
        });
    }

    map<U>(mapper: ReactiveMapper<T, U>) {
        const reactive = new ReactiveValue(mapper(this.current));
        reactive._origin = this;
        this._watchers.push(reactive._originWatcher = originalValue => {
            reactive.setSync(mapper(originalValue));
        });
        return reactive;
    }

    unlinkOrigin() {
        const { _origin } = this;
        if (_origin) {
            _origin.unwatch(this._originWatcher!);
            this._origin = null;
        }
        return this;
    }

    link<U extends Record<K, T>, K extends Key>(
        target: U, key: K
    ): U;
    link<U extends Record<K, V>, K extends Key, V>(
        target: U, key: K, mapper?: ReactiveMapper<T, V>
    ): U;
    link<U extends Record<K, T | V>, K extends Key, V>(
        target: U, key: K, mapper?: ReactiveMapper<T, V>
    ) {
        if (!this._links.some(link => link.target === target && link.key === key)) {
            target[key] = (mapper ? mapper(this.current) : this.current) as U[K];
            const watcher = (value: T) => {
                target[key] = (mapper ? mapper(value) : value) as U[K];
            };
            this._links.push({ target, key, watcher });
            this._watchers.push(watcher);
        }
        return target;
    }

    unlink<U>(target: U, key: keyof U) {
        const index = this._links.findIndex(link => link.target === target && link.key === key);
        if (~index) {
            this.unwatch(this._links[index].watcher);
            Utils.removeIndex(this._links, index);
        }
        return this;
    }

    toText(mapper?: ReactiveMapper<T, string>) {
        return this.link(document.createTextNode(''), 'data', mapper);
    }

    bind(element: HTMLElement) {
        if (!this._bindings.has(element)) {
            const event = ReactiveValue.getBindingEvent(element),
                listener = () => {
                    this.setSync((element as any).value);
                },
                watcher = (value: T) => {
                    (element as any).value = value;
                };
            element.addEventListener(event, listener);
            (element as any).value = this.current;
            this._watchers.push(watcher);
            this._bindings.set(element, { event, listener, watcher });
        }
        return this;
    }

    unbind(element: HTMLElement) {
        const binding = this._bindings.get(element);
        if (binding) {
            element.removeEventListener(binding.event, binding.listener);
            this.unwatch(binding.watcher);
            this._bindings.delete(element);
        }
        return this;
    }

}
