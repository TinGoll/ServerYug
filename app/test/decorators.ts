
/*
const enumerable = (value: boolean) => {
    return (target: any, prpertyKey: string|symbol, descriptor: PropertyDescriptor) => {
        descriptor.enumerable = value;
    }
}





const  logClass = (constructor: Function) => {
    console.log(constructor);
    
}

@logClass
class Test {
    constructor(public name: string, public age: number) {
        
    }
 
    public getPass(): string {
        return `${this.name} ${this.age}`
    }
}

const test = new Test('Вася', 32);

console.log(test.getPass());

*/