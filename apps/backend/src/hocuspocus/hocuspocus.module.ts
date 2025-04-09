import { Module } from '@nestjs/common';
import { HocuspocusGateway } from './hocuspocus.gateway';
import { FilesModule } from 'src/files/files.module';
import { jwtConstants } from 'src/auth/constants';
import { JwtModule } from '@nestjs/jwt';

@Module({
  exports: [HocuspocusGateway],
  providers: [HocuspocusGateway],
  imports: [
    FilesModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '2d' },
    }),
  ],
})
export class HocuspocusModule {}
