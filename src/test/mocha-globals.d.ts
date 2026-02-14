type TestCallback = () => void | Promise<void>;

declare function describe(name: string, callback: TestCallback): void;
declare function it(name: string, callback: TestCallback): void;
declare function before(callback: TestCallback): void;
declare function after(callback: TestCallback): void;
declare function beforeEach(callback: TestCallback): void;
declare function afterEach(callback: TestCallback): void;
