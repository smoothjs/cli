import { Catch, ExceptionFilter } from "@smoothjs/smooth";

@Catch()
export class /* upperFirstCamelName */ implements ExceptionFilter {
    async catch(
        exception: any,
        response: any,
    ) {
        response.send('Hello World')
    }
}