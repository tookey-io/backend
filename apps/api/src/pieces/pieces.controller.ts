import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { PiecesService } from './pieces.service';
import { Piece } from '@tookey/database';
import { PieceDto } from './pieces.dto';
import { AnyRoles } from '../decorators/any-role.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { InjectPinoLogger } from 'nestjs-pino';

@Controller('/api')
@UseInterceptors(ClassSerializerInterceptor)
export class PiecesController {
  constructor(
    @InjectPinoLogger(PiecesController.name) private readonly logger,
    private readonly piecesService: PiecesService,
  ) {}

  @Get('/flow-templates')
  async getTemplates(
    @Query('tags') tags?: string[],
    @Query('pieces') pieces?: string[],
    @Query('search') search?: string,
    @Query('featuredOnly') featuredOnly?: boolean,
  ) {
    console.debug({
      tags,
      pieces,
      search,
      featuredOnly,
    });

    return [
      {
        id: '9hhp5MgYt6xcErI84ccVi',
        created: '2023-09-26T22:15:36.395Z',
        updated: '2023-09-26T22:15:36.395Z',
        name: 'Set up FREE SMS notification about your portfolio value',
        description: '',
        tags: ['Notifications', 'Ethereum', 'Prices'],
        pieces: [
          '@activepieces/piece-schedule',
          '@tookey-io/piece-ethereum',
          '@activepieces/piece-binance',
          '@activepieces/piece-contiguity',
        ],
        template: {
          displayName: 'SMS Notification',
          trigger: {
            name: 'trigger',
            valid: true,
            displayName: 'Every Day',
            nextAction: {
              displayName: 'Read ERC20 Balance',
              name: 'step_2',
              valid: true,
              nextAction: {
                displayName: 'Fetch Pair Price',
                name: 'step_1',
                valid: true,
                nextAction: {
                  displayName: 'Code',
                  name: 'step_3',
                  valid: true,
                  nextAction: {
                    displayName: 'Send SMS',
                    name: 'step_5',
                    valid: true,
                    type: 'PIECE',
                    settings: {
                      pieceName: '@activepieces/piece-contiguity',
                      pieceVersion: '~0.1.1',
                      input: {
                        auth: '',
                        to: '',
                        message: "I have ${{step_3}} is my {{step_2['symbol']}} balance ({{step_2['parsedBalance']}}).",
                      },
                      inputUiInfo: {},
                      actionName: 'send_sms',
                    },
                  },
                  type: 'CODE',
                  settings: {
                    input: {
                      balance: "{{step_2['parsedBalance']}}",
                      price: '{{step_1}}',
                    },
                    inputUiInfo: {},
                    artifact:
                      'UEsDBAoAAAAAAJd9PFeUEcr6cgAAAHIAAAAIAAAAaW5kZXgudHNleHBvcnQgY29uc3QgY29kZSA9IGFzeW5jIChpbnB1dHMpID0+IHsKICAgIHJldHVybiAoTnVtYmVyKGlucHV0cy5iYWxhbmNlKSAqIE51bWJlcihpbnB1dHMucHJpY2UpKS50b0ZpeGVkKDQpOwp9OwpQSwMECgAAAAAAl308VxpS0QgcAAAAHAAAAAwAAABwYWNrYWdlLmpzb257CiAgImRlcGVuZGVuY2llcyI6IHsKICB9Cn0KUEsBAhQACgAAAAAAl308V5QRyvpyAAAAcgAAAAgAAAAAAAAAAAAAAAAAAAAAAGluZGV4LnRzUEsBAhQACgAAAAAAl308VxpS0QgcAAAAHAAAAAwAAAAAAAAAAAAAAAAAmAAAAHBhY2thZ2UuanNvblBLBQYAAAAAAgACAHAAAADeAAAAAAA=',
                  },
                },
                type: 'PIECE',
                settings: {
                  pieceName: '@activepieces/piece-binance',
                  pieceVersion: '~0.3.0',
                  input: {
                    first_coin: "{{step_2['symbol']}}",
                    second_coin: 'USDT',
                  },
                  inputUiInfo: {},
                  actionName: 'fetch_crypto_pair_price',
                },
              },
              type: 'PIECE',
              settings: {
                pieceName: '@tookey-io/piece-ethereum',
                pieceVersion: '~0.1.0',
                input: {
                  auth: '',
                  to: '',
                  account: '',
                  failOnRevert: false,
                  overrides: {},
                },
                inputUiInfo: {},
                actionName: 'erc20_balance',
              },
            },
            type: 'PIECE_TRIGGER',
            settings: {
              pieceName: '@activepieces/piece-schedule',
              pieceVersion: '~0.1.1',
              triggerName: 'every_day',
              input: {
                hour_of_the_day: 16,
                timezone: 'UTC',
                run_on_weekends: false,
              },
              inputUiInfo: {},
            },
          },
          valid: true,
        },
        userId: null,
        imageUrl: 'https://imagedelivery.net/Nn4rZTVgDyPkcgjQdbz5AA/88847fb5-cbd1-4487-10ef-d10001389000/public',
        featuredDescription: `
Great news for crypto enthusiasts! We are thrilled to unveil our latest template that enables you to set up FREE SMS notifications about your portfolio's value in USD!
        `,
        blogUrl: null,
        // blogUrl: 'https://tookey.io/usecases/ethereum-notifications',
        isFeatured: true,
        user: {
          email: 'mastro@tookey.io',
          firstName: 'Elias',
          lastName: 'Matro',
          imageUrl: 'https://imagedelivery.net/Nn4rZTVgDyPkcgjQdbz5AA/5014e2cc-ef0e-4e03-f8c4-c713364e6c00/public',
          title: 'BD Manager',
        },
      },
    ];
  }

  @Get('/pieces')
  async getAllPieces(@Query('release') release?: string) {
    return this.piecesService.getAllPieces(release);
  }

  @Get('/pieces/:name')
  async findPiece(@Param('name') name: string, @Query('version') version?: string) {
    const piece = await this.piecesService.getPiece(name, version);
    if (!piece) {
      throw new NotFoundException(`Piece ${name}${version ? `:${version}` : ''} not found`);
    }
    return piece;
  }
  @Get('/pieces/:vendor/:piece')
  async findPieceByVendorAndScope(
    @Param('vendor') vendor: string,
    @Param('piece') pieceName: string,
    @Query('version') version?: string,
  ) {
    const piece = await this.piecesService.getPiece(`${vendor}/${pieceName}`, version);
    if (!piece) {
      throw new NotFoundException(`Piece ${vendor}/${pieceName}${version ? `:${version}` : ''} not found`);
    }
    return piece;
  }

  @AnyRoles('admin.pieces.write')
  @JwtAuth()
  @Post('/admin/pieces')
  async createPiece(@Body() dto: PieceDto) {
    delete dto.id;
    return this.piecesService.createPiece(dto);
  }
}
