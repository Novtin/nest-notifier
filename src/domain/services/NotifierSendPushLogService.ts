import {CrudService} from '@steroidsjs/nest/usecases/services/CrudService';
import {ContextDto} from '@steroidsjs/nest/usecases/dtos/ContextDto';
import {SearchResultDto} from '@steroidsjs/nest/usecases/dtos/SearchResultDto';
import {Type} from '@nestjs/common';
import {validateOrReject} from '@steroidsjs/nest/usecases/helpers/ValidationHelper';
import SearchQuery from '@steroidsjs/nest/usecases/base/SearchQuery';
import {INotifierSendPushLogRepository} from '../interfaces/INotifierSendPushLogRepository';
import {NotifierSendPushLogModel} from '../models/NotifierSendPushLogModel';
import {NotifierSendPushLogSaveDto} from '../dtos/NotifierSendPushLogSaveDto';
import {NotifierSendPushLogSearchDto} from '../dtos/NotifierSendPushLogSearchDto';

export class NotifierSendPushLogService extends CrudService<
    NotifierSendPushLogModel,
    NotifierSendPushLogSearchDto,
    NotifierSendPushLogSaveDto> {
    protected modelClass = NotifierSendPushLogModel;

    constructor(
        /** NotifierSendPushLogRepository */
        public repository: INotifierSendPushLogRepository,
    ) {
        super();
    }

    async search(dto: NotifierSendPushLogSearchDto, context?: ContextDto | null)
        : Promise<SearchResultDto<NotifierSendPushLogModel>>

    async search<TSchema>(
        dto: NotifierSendPushLogSearchDto,
        context?: ContextDto | null,
        schemaClass?: Type<TSchema>
    ): Promise<SearchResultDto<Type<TSchema>>>

    async search<TSchema>(
        dto: NotifierSendPushLogSearchDto,
        context: ContextDto = null,
        schemaClass: Type<TSchema> = null,
    ): Promise<SearchResultDto<NotifierSendPushLogModel | Type<TSchema>>> {
        await validateOrReject(dto);

        const searchQuery: SearchQuery<NotifierSendPushLogModel> = schemaClass
            ? SearchQuery.createFromSchema(schemaClass)
            : new SearchQuery<any>();
        searchQuery.alias('model');

        ['id', 'sendLogId', 'messageId', 'errorCode', 'errorMessage'].forEach(key => {
            if (dto[key]) {
                searchQuery.andWhere(['=', key, dto[key]]);
            }
        });

        const result = await this.repository.search<TSchema>(
            dto,
            searchQuery,
        );
        if (schemaClass) {
            result.items = result.items.map(
                (model: NotifierSendPushLogModel) => this.modelToSchema<TSchema>(model, schemaClass),
            );
        }
        // @ts-ignore
        return result;
    }
}
