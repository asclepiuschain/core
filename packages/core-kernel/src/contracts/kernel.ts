import { AbstractServiceProvider } from "../support";

export interface IContainer {
    /**
     * Resolve the given name from the container.
     */
    resolve<T = any>(name: string): T;

    /**
     * Register a class within the container.
     */
    bind(name: string, concrete: any): void;

    /**
     * Register a class within the container.
     */
    shared(name: string, concrete: any): void;

    /**
     * Alias a registration to a different name.
     */
    alias(name: string, alias: string): void;

    /**
     * Determine if the given name has been registered.
     */
    has(name: string): boolean;
}

export interface IApplication extends IContainer {
    readonly providers: Set<AbstractServiceProvider>;

    /**
     * Boot the application's service providers.
     */
    bootstrap(config: Record<string, any>): void;

    /**
     * Boot the application.
     */
    boot(): void;

    /**
     * Reboot the application.
     */
    reboot(): void;

    /**
     * Get or set the specified configuration value.
     */
    config<T = any>(key: string, value?: T): T;

    /**
     * Get the namespace number of the application.
     */
    namespace(): string;

    /**
     * Get the version number of the application.
     */
    version(): string;

    /**
     * Get the current application token.
     */
    token(): string;

    /**
     * Get the current application network.
     */
    network(): string;

    /**
     * Set the current application network.
     */
    useNetwork(value: string): void;

    /**
     * Get the path to the data directory.
     */
    dataPath(path?: string): string;

    /**
     * Set the data directory.
     */
    useDataPath(path: string): void;

    /**
     * Get the path to the config directory.
     */
    configPath(path?: string): string;

    /**
     * Set the config directory.
     */
    useConfigPath(path: string): void;

    /**
     * Get the path to the cache directory.
     */
    cachePath(path?: string): string;

    /**
     * Set the cache directory.
     */
    useCachePath(path: string): void;

    /**
     * Get the path to the log directory.
     */
    logPath(path?: string): string;

    /**
     * Set the log directory.
     */
    useLogPath(path: string): void;

    /**
     * Get the path to the temp directory.
     */
    tempPath(path?: string): string;

    /**
     * Set the temp directory.
     */
    useTempPath(path: string): void;

    /**
     * Get the environment file the application is using.
     */
    environmentFile(): string;

    /**
     * Get the current application environment.
     */
    environment(): string;

    /**
     * Set the current application environment.
     */
    useEnvironment(value: string): void;

    /**
     * Determine if application is in local environment.
     */
    isProduction(): boolean;

    /**
     * Determine if application is in local environment.
     */
    isDevelopment(): boolean;

    /**
     * Determine if the application is running tests.
     */
    runningTests(): boolean;

    /**
     * Determine if the application has been bootstrapped.
     */
    isBootstrapped(): boolean;

    /**
     * Determine if the application configuration is cached.
     */
    configurationIsCached(): boolean;

    /**
     * Get the path to the configuration cache file.
     */
    getCachedConfigPath(): string;

    /**
     * Put the application into maintenance mode.
     */
    enableMaintenance(): void;

    /**
     * Bring the application out of maintenance mode
     */
    disableMaintenance(): void;

    /**
     * Determine if the application is currently down for maintenance.
     */
    isDownForMaintenance(): boolean;

    /**
     * Terminate the application.
     */
    terminate(): void;
}

export interface ILogger {
    /**
     * System is unusable.
     */
    emergency(message: any): void;

    /**
     * Action must be taken immediately.
     *
     * Example: Entire website down, database unavailable, etc. This should
     * trigger the SMS alerts and wake you up.
     */
    alert(message: any): void;

    /**
     * Critical conditions.
     *
     * Example: Application component unavailable, unexpected exception.
     */
    critical(message: any): void;

    /**
     * Runtime errors that do not require immediate action but should typically
     * be logged and monitored.
     */
    error(message: any): void;

    /**
     * Exceptional occurrences that are not errors.
     *
     * Example: Use of deprecated APIs, poor use of an API, undesirable things
     * that are not necessarily wrong.
     */
    warning(message: any): void;

    /**
     * Normal but significant events.
     */
    notice(message: any): void;

    /**
     * Interesting events.
     *
     * Example: User logs in, SQL logs.
     */
    info(message: any): void;

    /**
     * Detailed debug information.
     */
    debug(message: any): void;

    /**
     * Logs with an arbitrary level.
     */
    log(level: string, message: any): void;

    /**
     * Suppress any console output.
     */
    muteConsole(suppress: boolean): void;
}