/*
const enumerable = (value: boolean) => {
    return (target: any, prpertyKey: string|symbol, descriptor: PropertyDescriptor) => {
        descriptor.enumerable = value;
    }
}

*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var logClass = function (constructor) {
    console.log(constructor);
};
var Test = /** @class */ (function () {
    function Test(name, age) {
        this.name = name;
        this.age = age;
    }
    Test.prototype.getPass = function () {
        return this.name + " " + this.age;
    };
    Test = __decorate([
        logClass
    ], Test);
    return Test;
}());
var test = new Test('Вася', 32);
console.log(test.getPass());
