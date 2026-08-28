import { IsString } from 'class-validator';

export class CheckOutSelfDto {
  @IsString()
  employeeId: string;
}
