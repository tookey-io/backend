import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { AppConfiguration } from 'apps/app/src/app.config';

export class GoogleAuthLoginDto {
    @ApiProperty({ example: 'abc' })
    @IsNotEmpty()
    idToken: string;
}


export interface SocialInterface {
    googleId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    payload: TokenPayload;
}


@Injectable()
export class AuthGoogleService {
    private google: OAuth2Client;

    constructor(private configService: ConfigService<AppConfiguration>) {
        const config = configService.get('google', { infer: true })
        const { clientId, clientSecret } = config

        this.google = new OAuth2Client(
            clientId,
            clientSecret
        );
    }

    async getProfileByToken(
        loginDto: GoogleAuthLoginDto,
    ): Promise<SocialInterface> {
        const ticket = await this.google.verifyIdToken({
            idToken: loginDto.idToken,
            // TODO: check typings and issue.. idk why it's hack, but only one way to make it work
            requiredAudience: this.configService.getOrThrow('google', { infer: true }).clientId!,
        } as any);

        const data = ticket.getPayload();

        if (!data) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'wrongToken',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        return {
            googleId: data.sub,
            email: data.email,
            firstName: data.given_name,
            lastName: data.family_name,
            payload: data
        };
    }
}
