import { existsSync, AppServiceRegistration } from './deps.ts';
import type { MatrixConfig } from './mod.ts';

export function setup_registration(config: MatrixConfig) {
    if (!existsSync(config.reg_path)) {
        const reg = new AppServiceRegistration(config.appserviceUrl);
        reg.setAppServiceToken(AppServiceRegistration.generateToken());
        reg.setHomeserverToken(AppServiceRegistration.generateToken());
        reg.setId(AppServiceRegistration.generateToken());
        reg.setProtocols(['lightning']);
        reg.setRateLimited(false);
        reg.setSenderLocalpart('bot.lightning');
        reg.addRegexPattern(
            'users',
            `@lightning-.+_.+:${config.domain}`,
            true,
        );
        reg.outputAsYaml(config.reg_path);
    }
}