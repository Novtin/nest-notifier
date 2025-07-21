# nest-notifier

Модуль уведомлений для библиотеки [Steroids Nest](https://github.com/steroids/nest)

# Предназначение

Модуль позволяет быстро внедрить в проект функциональность, связанную с отправкой и логированием уведомлений:
- уведомления по электронной почте
- сообщения по SMS
- звонки с уведомлением
- отправка push-уведомлений
- отправка голосового сообщения

# Быстрый старт

Для того чтобы подключить NotifierModule в существующий проект на Steroids Nest
нужно следовать шагам, описанным ниже.

1. Установите пакет:
```sh
yarn add @steroidsjs/nest-notifier
```

2. Определить NotifierModule с конфигурацией из `@steroidsjs/nest-notifier`. 
Также можно выбирать только нужные провайдеры уведомлений для `NotifierService`:

```typescript
import {Module} from '@steroidsjs/nest/infrastructure/decorators/Module';
import {INotifierModuleConfig} from '@steroidsjs/nest-notifier/infrastructure/config';
import {ModuleHelper} from '@steroidsjs/nest/infrastructure/helpers/ModuleHelper';
import {INotifierService} from '@steroidsjs/nest-modules/notifier/services/INotifierService';
import {NotifierService} from '@steroidsjs/nest-notifier/domain/services/NotifierService';
import {SmscSmsProvider} from '@steroidsjs/nest-notifier/domain/providers/SmscSmsProvider';
import {FirebasePushProvider} from '@steroidsjs/nest-notifier/domain/providers/FirebasePushProvider';
import coreModule from '@steroidsjs/nest-notifier';
import notifierConfig from '@steroidsjs/nest-notifier/infrastructure/config';

@Module({
    ...coreModule,
    tables: [...(coreModule.tables ?? [])],
    config: notifierConfig,
    module: (config: INotifierModuleConfig) => {
        const module = coreModule.module(config);
        return {
            ...module,
            imports: [
                ...(module.imports ?? []),
            ],
            controllers: [
                ...(module.controllers ?? []),
            ],
            providers: [
                ...(module.providers ?? []),
                ModuleHelper.provide(NotifierService, INotifierService, [
                    INotifierProviderService,
                    NotifierSendRequestService,
                    [
                        SmscSmsProvider,
                        FirebasePushProvider,
                    ],
                ]),
            ],
            exports: [
                ...(module.exports ?? []),
            ],
        };
    },
})
export class NotifierModule {}
```

3. Импортировать созданный модуль в главный модуль:
```typescript
import coreModule from '@steroidsjs/nest/infrastructure/applications/rest/config';
import {Module} from '@steroidsjs/nest/infrastructure/decorators/Module';
import {NotifierModule} from '../../notifier/infrastructure/NotifierModule';

@Module({
    ...coreModule,
    module: (config) => {
        const module = coreModule.module(config);
        return {
            ...module,
            imports: [
                ...(module.imports ?? []), 
                NotifierModule,
            ],
        };
    },
})
export class AppModule {}
```

4. Сгенерировать и запустить миграции:

```shell
yarn cli migrate:generate
````

```shell
yarn cli migrate
```

# Устройство модуля

## Конфигурация

Конфигурация модуля определена интерфейсом `INotifierModuleConfig`
(находится в файле `src/infrastructure/config.ts`).
Интерфейс INotifierModuleConfig описывает структуру конфигурации модуля уведомлений, позволяя задать 
поддерживаемые провайдеры уведомлений и их настройки, включая данные авторизации.

# Провайдеры уведомлений

- [FirebasePushProvider](https://firebase.google.com/products/cloud-messaging?hl=en) - отправка push-уведомлений через Firebase Cloud Messaging
- [MailProvider](https://nest-modules.github.io/mailer/) - отправка уведомлений по электронной почте
- [SmscCallProvider](https://smsc.ru/api/http/send/voice/#menu) - голосовые звонки через API SMSC
- [SmscSmsProvider](https://smsc.ru/api/http/send/sms/#menu) - отправка SMS-сообщений через сервис SMSC
- [SmscVoiceMessageProvider](https://smsc.ru/api/http/send/voice/#menu) - голосовые сообщения через SMSC
- [SmsRuCallProvider](https://sms.ru/api/code_call) - отправка звонков через API SMS.ru
- [SmsRuSmsProvider](https://sms.ru/api/send) - отправка SMS через SMS.ru

> Примечание: Для работы FirebasePushProvider вам необходимо [получить ключ сервера Firebase](https://firebase.google.com/docs/cloud-messaging/auth-server?hl=ru) и указать путь к нему в переменной среды вашей операционной системы GOOGLE_APPLICATION_CREDENTIALS.

> Примечание: Для работы MailProvider вы также должны [подключить MailerModule](https://nest-modules.github.io/mailer/docs/mailer#configuration) из @nestjs-modules/mailer к своему модулю

## Модели

#### NotifierSendLogModel
Основной лог отправки уведомления. Содержит тип, имя провайдера, статус отправки, сообщение об ошибке,
получателя и (опционально) детали push-отправки.

#### NotifierSendPushLogModel
Детализированный лог отправки push-уведомлений. Содержит внешний ID, код и описание ошибки.

#### NotifierSendRequestModel
Модель запроса на отправку уведомлений. 
Хранит список связанных логов (`NotifierSendLogModel`) по каждому провайдеру,
участвующему в отправке одного уведомления.

## Доменные сервисы

#### NotifierSendLogService
Сервис с CRUD-операциями над моделью `NotifierSendLogModel`.
#### NotifierSendPushLogService
Сервис с CRUD-операциями над моделью `NotifierSendPushLogModel`.
#### NotifierSendRequestService
Сервис с CRUD-операциями над моделью `NotifierSendRequestModel`.
#### NotifierService
Сервис отправки сообщений через различные каналы: sms, call, mail, push, voice.

# Пример использования

```ts
import {Inject} from '@nestjs/common';
import {INotifierService} from '@steroidsjs/nest-modules/notifier/services/INotifierService';
import NotifierProviderType from '@steroidsjs/nest-modules/notifier/enums/NotifierProviderType';
import {INotifierCallOptions} from '@steroidsjs/nest-modules/notifier/interfaces/INotifierSendOptions';

export class AuthConfirmService {
    constructor(
        @Inject(INotifierService)
        protected readonly notifierService: INotifierService,
    ) {
    }

    protected async sendCall(phone: string) {
        const response = await this.notifierService.send({
            [NotifierProviderType.CALL]: {
                phone,
            } as INotifierCallOptions,
        });

        code = response[NotifierProviderType.CALL];

        return code;
    }
}
```
