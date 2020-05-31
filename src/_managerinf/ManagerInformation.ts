import VersionNumber from 'src/model/VersionNumber';

export default class ManagerInformation {
    public static VERSION: VersionNumber = new VersionNumber('1.0.0');
    public static IS_PORTABLE: boolean = false;
}
