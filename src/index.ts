import {NotifierModule} from '@steroidsjs/nest-modules/notifier/NotifierModule';
import tables from './infrastructure/tables';
import config from './infrastructure/config';
import module from './infrastructure/module';
import {IModule} from "@steroidsjs/nest/infrastructure/decorators/Module";

export default {
    rootTarget: NotifierModule,
    tables,
    config,
    module,
} as IModule;
