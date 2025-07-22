# nest-notifier

Модуль уведомлений для библиотеки [Steroids Nest](https://github.com/steroids/nest)

# Предназначение

Модуль позволяет быстро внедрить в проект функциональность,
связанную с отправкой и логированием уведомлений следующих типов:
- электронные письма
- SMS
- push-уведомления
- голосовые звонки
- голосовые сообщения

# Быстрый старт

Для того чтобы подключить NotifierModule в существующий проект на Steroids Nest
нужно:

1. Установить пакеты:
```sh
yarn add @steroidsjs/nest-notifier @steroidsjs/nest-modules
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
Интерфейс INotifierModuleConfig описывает конфигурацию модуля уведомлений,
в которой задаются поддерживаемые провайдеры и их параметры, включая данные авторизации.

## Провайдеры уведомлений

Провайдер уведомлений — это класс, отвечающий за отправку уведомлений. 
Он реализует интерфейс `INotifierProvider` и содержит код, который выполняет отправку через конкретный сервис.

Реализованные провайдеры:

- [FirebasePushProvider](https://github.com/steroids/nest-notifier/blob/main/src/domain/providers/FirebasePushProvider.ts) - отправка push-уведомлений через [Firebase Cloud Messaging](https://firebase.google.com/products/cloud-messaging?hl=en)
- [MailProvider](https://github.com/steroids/nest-notifier/blob/main/src/domain/providers/MailProvider.ts) - отправка писем по электронной почте с помощью [NestJS Mailer](https://nest-modules.github.io/mailer/)
- [SmscCallProvider](https://github.com/steroids/nest-notifier/blob/main/src/domain/providers/SmscCallProvider.ts) - отправка звонков через [SMSC](https://smsc.ru/api/http/send/voice/#menu)
- [SmscSmsProvider](https://github.com/steroids/nest-notifier/blob/main/src/domain/providers/SmscSmsProvider.ts) - отправка SMS через [SMSC](https://smsc.ru/api/http/send/sms/#menu)
- [SmscVoiceMessageProvider](https://github.com/steroids/nest-notifier/blob/main/src/domain/providers/SmscVoiceMessageProvider.ts) - отправка голосовых сообщений через [SMSC](https://smsc.ru/api/http/send/voice/#menu)
- [SmsRuCallProvider](https://github.com/steroids/nest-notifier/blob/main/src/domain/providers/SmsRuCallProvider.ts) - отправка звонков через [SMS.ru](https://sms.ru/api/code_call)
- [SmsRuSmsProvider](https://github.com/steroids/nest-notifier/blob/main/src/domain/providers/SmsRuSmsProvider.ts) - отправка SMS через [SMS.ru](https://sms.ru/api/send)

> Примечание: Для работы FirebasePushProvider вам необходимо [получить ключ сервера Firebase](https://firebase.google.com/docs/cloud-messaging/auth-server?hl=ru) и указать путь к нему в переменной среды вашей операционной системы GOOGLE_APPLICATION_CREDENTIALS.

> Примечание: Для работы MailProvider вы также должны [подключить MailerModule](https://nest-modules.github.io/mailer/docs/mailer#configuration) из @nestjs-modules/mailer к своему модулю

## Модели

#### NotifierSendLogModel
Основной лог отправки уведомления. Содержит тип, имя провайдера, статус отправки, сообщение об ошибке,
получателя и (опционально) детали push-отправки.

Для чего можно использовать:
- Отладка сбоев при интеграции с внешними провайдерами.
- Аналитика успешных и неуспешных отправок по типу уведомлений и провайдерам.

#### NotifierSendPushLogModel
Детализированный лог отправки push-уведомлений. Содержит внешний ID, код и описание ошибки.

Для чего можно использовать:
- Отладка сбоев при доставке push-сообщений.
- Связывание с внешними системами по `messageId`.

#### NotifierSendRequestModel
Модель запроса на отправку уведомлений. 
Хранит список связанных логов (`NotifierSendLogModel`) по каждому провайдеру,
участвующему в отправке одного уведомления.

Для чего можно использовать:
- Группировка мультиканальных отправок.
- Централизованный контроль для одного логического уведомления по разным каналам.

## Доменные сервисы

#### NotifierSendLogService
Сервис с CRUD-операциями над моделью `NotifierSendLogModel`.
#### NotifierSendPushLogService
Сервис с CRUD-операциями над моделью `NotifierSendPushLogModel`.
#### NotifierSendRequestService
Сервис с CRUD-операциями над моделью `NotifierSendRequestModel`.
#### NotifierService
Сервис отправки сообщений через различные каналы: sms, call, mail, push, voice.
Вызывает нужный [провайдер уведомлений](#провайдеры-уведомлений). 
Более подробное описание работы разобрано ниже.

# Пример использования

```typescript
import {Inject} from '@nestjs/common';
import {INotifierService} from '@steroidsjs/nest-modules/notifier/services/INotifierService';
import {IAuthConfirmServiceConfig} from '../config/IAuthConfirmServiceConfig';

export class AuthConfirmService {
    constructor(
        @Inject(INotifierService)
        protected readonly notifierService: INotifierService,
    ) {
    }

    protected async sendSms(config: IAuthConfirmServiceConfig, phone: string) {
        code = generateCode(config.smsCodeLength);
        
        await this.notifierService.send({
            sms: {
                phone,
                message: config.messageTemplate.replace('{code}', code),
                name: config.providerName,
            },
        });
        
        return code;
    }
}
```

Что происходит внутри `NotifierService` (используемого в примере через интерфейс `INotifierService`):
- Вызывается метод `send` с объектом, указывающим тип уведомления (`sms = NotifierProviderType.SMS`) и его параметры.
- `NotifierService` выбирает активного провайдера для типа `NotifierProviderType.SMS`.
- Создаётся запись о запросе на уведомление (`NotifierSendRequestService`).
- Выполняется отправка через соответствующий `INotifierProvider` (например, через `SmsRuSmsProvider`).
- Внутри провайдера создаются записи логов (`NotifierSendLogModel`), привязанные к переданному id запроса на уведомление (`NotifierSendRequestService`).
Для push-уведомлений дополнительно сохраняется запись `NotifierSendPushLogModel`, связанная с конкретным `NotifierSendLogModel`.
- Возвращается результат отправки, включая id запроса на уведомление (`NotifierSendRequestModel`)
и данные от провайдера (id моделей `NotifierSendLogModel` и payload от провайдера).

> Можно одновременно отправить уведомления нескольких типов, передав объект с несколькими ключами:
> - mail
> - sms
> - push
> - call
> - voice
> 
> Для каждого способа отправки нужно передавать разные данные, которые описаны в соответствующих интерфейсах.
Эти интерфейсы находятся в `@steroidsjs/nest-modules/notifier/interfaces`.
