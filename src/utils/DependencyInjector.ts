import 'reflect-metadata';

export interface Constructor<T> {
    new (...args: any[]): T;
}

type InjectorClassDecorator<T extends Function> = (Target: Constructor<T>) => T | void;

export const Injectable = (): InjectorClassDecorator<any> => {
    return Target => {}
}

export const Injector = new class {
    resolve<T>(Target: Constructor<T>): T {
        const requiredParams = Reflect.getMetadata('design:paramtypes', Target) || [];
        const resolvedParams = requiredParams.map((param: any) => Injector.resolve(param));
        const instance = new Target(...resolvedParams);
        return instance;
    }
}