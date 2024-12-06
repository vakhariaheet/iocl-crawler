export interface Transaction {
  orderNo: number;
  docNo: number;
  transactionDate: string;
  transactionTime: string;
  ttNo: string;
  material: number;
  materialName: string;
  billQty: number;
  unit: string;
  billAmt: number;
  dbCr: string;
  comp: number;
  docType: string;
  plant: number;
  cca: string;
  soldToParty: number;
  shipToParty: number;
  companyName?: string;
}