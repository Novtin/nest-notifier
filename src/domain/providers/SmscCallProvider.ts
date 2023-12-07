import axios from 'axios';
import NotifierProviderType from '@steroidsjs/nest-modules/notifier/enums/NotifierProviderType';
import {
    INotifierCallOptions,
} from '@steroidsjs/nest-modules/notifier/interfaces/INotifierSendOptions';
import NotifierSendException from '@steroidsjs/nest-modules/notifier/exceptions/NotifierSendException';
import {ModuleHelper} from '@steroidsjs/nest/infrastructure/helpers/ModuleHelper';
import {NotifierModule} from '@steroidsjs/nest-modules/notifier/NotifierModule';
import {DataMapper} from '@steroidsjs/nest/usecases/helpers/DataMapper';
import {INotifierProvider} from '../interfaces/INotifierProvider';
import {INotifierModuleConfig} from '../../infrastructure/config';
import {NotifierSendLogService} from '../services/NotifierSendLogService';
import {NotifierSendLogSaveDto} from '../dtos/NotifierSendLogSaveDto';
import {NotifierStatusEnum} from '../enums/NotifierStatusEnum';

export class SmscCallProvider implements INotifierProvider {
    public type = NotifierProviderType.CALL;

    public name = 'smsc';

    constructor(private notifierSendLogService: NotifierSendLogService) {}

    async send(options: INotifierCallOptions): Promise<{
        logsIds: number[],
        providerPayload: any,
    }> {
        const credentials = ModuleHelper.getConfig<INotifierModuleConfig>(NotifierModule).providers.call.smsc;

        const resultPayload = [];
        const logsIds = [];
        for (const phone of [].concat(options.phone)) {
            const normalizedPhone = phone.replace('/[^0-9]+/', '').replace('/^8/', '7');
            try {
                if (!credentials.login) {
                    throw new Error('Wrong SmscCallProvider configuration, please set "notifier.providers.call.smsc.login" param.');
                }
                if (!credentials.password) {
                    throw new Error('Wrong SmscCallProvider configuration, please set "notifier.providers.call.smsc.password" param.');
                }

                const response = await axios.post(
                    'https://smsc.ru/sys/send.php',
                    null,
                    {
                        params: {
                            login: credentials.login,
                            psw: credentials.password,
                            phones: normalizedPhone,
                            mes: 'code',
                            call: 1,
                            fmt: 3,
                        },
                    },
                );
                if (response.data.error) {
                    throw new NotifierSendException(response.data.error);
                }

                if (!response.data.code) {
                    throw new NotifierSendException('SMSC.RU, not found code in response: ' + JSON.stringify(response.data));
                }
                resultPayload.push(response.data);

                const logDto = DataMapper.create<NotifierSendLogSaveDto>(NotifierSendLogSaveDto, {
                    sendRequestId: options.sendRequestId,
                    providerType: this.type,
                    providerName: this.name,
                    receiver: normalizedPhone,
                    status: NotifierStatusEnum.SENT,
                });
                const log = await this.notifierSendLogService.create(logDto);
                logsIds.push(log.id);
            } catch (e) {
                console.error('Error sending call: ', e);
                const logDto = DataMapper.create<NotifierSendLogSaveDto>(NotifierSendLogSaveDto, {
                    sendRequestId: options.sendRequestId,
                    providerType: this.type,
                    providerName: this.name,
                    receiver: normalizedPhone,
                    status: NotifierStatusEnum.ERROR,
                    errorMessage: e.toString(),
                });
                const log = await this.notifierSendLogService.create(logDto);
                logsIds.push(log.id);
            }
        }

        return {
            logsIds,
            providerPayload: resultPayload,
        };
    }
}
