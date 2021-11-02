import { OverrideableBuilder } from "../../lib/ts/index";

type OriginalType = {
    anotherFunc: () => number,
    someFunc: () => number,
    testFunc: () => number,
}

const originalImplementation: OriginalType = {
    anotherFunc() {
        return 10;
    },
    someFunc() {
        return this.anotherFunc() + 1;
    },
    testFunc() {
        return this.someFunc() * 2;
    },
};


const builder = new OverrideableBuilder(originalImplementation);

builder.override((oi) => {
    oi.anotherFunc();
    return oi;
});

builder.override((oi, builder) => {
    builder.override((oi2) => {
        oi2.anotherFunc();
        return oi2;
    });
    oi.someFunc();
    return oi;
})